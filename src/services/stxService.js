/**
 * @file stxService.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 */

// logger
const LOGGER = require('../logger/logger');

// dao
const transactionsDAO = require('../dao/transactionsDAO');

// constants
const CONSTANTS = require('../constants/constants');

// utils
const tlogUtils = require('../utils/tlogUtils');
const fileUpload = require('../utils/fileUpload');
const fileCreate = require('../utils/fileCreate');

/**
 * Generate the output string on a tax line for a store
 * @param {Object} totals the tax amounts
 * @param {string} taxId the tax id
 * @returns {string} a string representation of the total tax amounts
 */
function generateOutputPerTaxId(totals, taxId) {
    // get the tax plan number
    const id = '0' + taxId.slice(0, 1);

    // sum of tax
    const sumOfTaxAmountString = tlogUtils.createTotalAmountString(
        totals.sumOfTax,
        false
    );

    // tax collected
    const taxCollectedAmountString = tlogUtils.createTotalAmountString(
        totals.taxCollected,
        false
    );

    // tax discounted
    const taxDiscountedAmountString = tlogUtils.createTotalAmountString(
        totals.taxDiscounted,
        false
    );
    // return as a string
    return `${id}${sumOfTaxAmountString}${taxCollectedAmountString}${taxDiscountedAmountString}`;
}

/**
 * Generate STX output for a given store
 * @param {Object} totals totals object containing the tax totals for this store
 * @param {string} storeId store id
 * @param {string} endDate optional, only for adhoc run
 * @returns {string} string representation of the STX output
 */
function generateSTXOutputPerStoreId(totals, storeId, endDate = null) {
    let str = '';
    // the date will vary depending on the type of run
    let dt;
    if (endDate) {
        dt = new Date(endDate);
    } else {
        dt = new Date();
        dt.setDate(dt.getDate() - 1); // set date to yesterday
    }
    const date = ('0' + dt.getUTCDate()).slice(-2);
    const month = ('0' + (dt.getUTCMonth() + 1)).slice(-2);
    let currKey = 0;
    const numKeys = Object.keys(totals).length - 1;
    for (let taxId of Object.keys(totals)) {
        // get the record line for the current taxId
        const firstPartLine = generateOutputPerTaxId(totals[taxId], taxId);

        // get the end descriptor of the line
        let desc = totals[taxId].name.trim();

        // left align the descriptor
        if (desc.length > CONSTANTS.DESC_LENGTH) {
            // if descriptor length exceeds CONSTANTS.DESC_LENGTH,
            // then we need to truncate the descriptor
            desc = desc.substring(0, CONSTANTS.DESC_LENGTH);
        }
        const descriptionPadding = tlogUtils.descriptionAlignment(desc);

        // create the end of the line string
        const secondPartLine = `${desc}${descriptionPadding}${dt.getFullYear()}${month}${date}${storeId}${
            CONSTANTS.RECORD_TYPE.STX
        }`;

        // calculate filler space
        const padding = tlogUtils.generatePadding(
            firstPartLine,
            secondPartLine
        );

        // create line
        const line = `${firstPartLine}${padding}${secondPartLine}`;

        // append to str
        str += line;
        if (currKey !== numKeys) {
            str += '\n';
        }
        currKey++;
    }
    return str;
}

/**
 * Calculate the tax totals for STX record
 * @param {Array} tlogs an array containing all tlogs for this store
 * @returns {Object} an object containing the tax totals for STX record
 */
function getTaxesPerStoreId(tlogs) {
    let totalTaxes = {};

    for (let tlog of tlogs) {
        // iterate through total taxes
        for (let tax of tlog.tlog.totalTaxes) {
            // get the tax id and name
            const taxId = tax.id;
            const taxName = tax.name;
            // aggregate totalTaxes.amount.amount

            if (!Object.keys(totalTaxes).includes(taxId)) {
                // create a new tax entry in totalTaxes object
                totalTaxes[taxId] = {
                    name: taxName,
                    sumOfTax: 0,
                    taxCollected: 0,
                    taxDiscounted: 0,
                };
            }

            let amt = tax.taxableAmount.amount;
            if(tax.isRefund === true)
            {
                amt = amt * -1;
            }
            totalTaxes[taxId].sumOfTax += amt;

            // aggregate tax collected if there is no tax exempt amount available
            if (!tax.taxExempt) {
                // iterate through items in tlog object
                for (let item of tlog.tlog.items) {
                    // iterate through itemTaxes
                    for (let itemTax of item.itemTaxes) {
                        if (itemTax.id === taxId) {
                            // aggregate itemTaxes.amount.amount
                            let itmAmt = itemTax.amount.amount;
                            if(itemTax.isRefund === true){
                                itmAmt = itmAmt * -1;
                            }
                            totalTaxes[taxId].taxCollected +=
                                itmAmt;
                        }
                    }
                }
            } else {
                // aggregate taxExempt.exemptAmount.amount
                totalTaxes[taxId].taxDiscounted +=
                    tax.taxExempt.exemptAmount.amount;
            }
        }
    }
    return totalTaxes;
}

/**
 * Find all the tlogs that match the given criteria
 * @param {string} runType 'daily', 'weekly', 'adhoc'
 * @param {string} startDate only used when runType is 'adhoc'
 * @param {string} endDate only used when runType is 'adhoc'
 * @returns {Array} an array containing all matching documents
 */
async function findStxTLogs(runType, startDate, endDate) {
    LOGGER.debug(`Entering into findStxTLogs()`);
    // set query and projection
    const query = {
        'tlog.transactionType': 'SALES',
        'tlog.isVoided': false,
        'tlog.isSuspended': false,
        'tlog.isRecalled': false,
        isTrainingMode: false,
    };

    const projection = {
        id: 1,
        'transactionNumber':1,
        'tlog.totalTaxes': 1,
        'tlog.items': 1,
        'siteInfo.id': 1,
    };

    // add different date ranges depending on the run type
    if (runType === CONSTANTS.PARAMS.DAILY) {
        // create the daily run query
        let start = new Date();
        start.setUTCHours(0, 0, 0);
        start.setDate(start.getDate() - 1); // turn date into yesterday

        // add to query
        query['businessDay.dateTime'] = start.toISOString().split('.')[0] + 'Z';
    }
    if (runType === CONSTANTS.PARAMS.WEEKLY) {
        // query must be any date from the previous sunday to saturday
        let start = new Date();
        // get previous sunday date
        start.setUTCHours(0, 0, 0);
        start.setDate(start.getDate() - 7);

        let end = new Date();
        // get saturday date
        end.setUTCHours(23, 59, 59);
        end.setDate(end.getDate() - 1);
        // add to query
        query['businessDay.dateTime'] = {
            $gte: start.toISOString().split('.')[0] + 'Z',
            $lte: end.toISOString().split('.')[0] + 'Z',
        };
    }
    if (runType === CONSTANTS.PARAMS.ADHOC) {
        // set a custom time range to look for transactions
        let start = new Date(startDate);
        start.setUTCHours(0, 0, 0, 0);
        let end = new Date(endDate);
        end.setUTCHours(0, 0, 0, 0);

        query['businessDay.dateTime'] = {
            $gte: start.toISOString().split('.')[0] + 'Z',
            $lte: end.toISOString().split('.')[0] + 'Z',
        };
    }

    // find in collection
    try {
        const result = await transactionsDAO
            .findTransactions(query, projection)
            .then((result) => result);
        return result;
    } catch (error) {
        LOGGER.error(`Error in findStxLogs() :: ${error}`);
        throw new Error(error);
    }
}

/**
 * This function executes all the STX calculations to generate an
 * extract and uploads a fil to Azure Storage
 * @param {string} runType 'daily', 'weekly', 'adhoc'
 * @param {string} startDate optional, only used when runType is 'adhoc'
 * @param {string} endDate optional, only used when runType is 'adhoc'
 * @returns {string} a string containing the generated extract
 */
async function runSTX(runType, startDate = null, endDate = null) {
    try {
        let response = '';
        // find the matching tlogs
        const tlogs = await findStxTLogs(runType, startDate, endDate);

        // sort by store id
        const logsByStore = tlogUtils.extractLogsByStoreId(tlogs);

        const numKeys = Object.keys(logsByStore).length - 1;
        let currKey = 0;
        // iterate through each collection of tlogs by store id
        for (let storeId of Object.keys(logsByStore)) {
            const totals = getTaxesPerStoreId(logsByStore[storeId]);
            // generate output
            const storeOutput = generateSTXOutputPerStoreId(
                totals,
                storeId,
                endDate
            );
            // add it to the response
            response += storeOutput;
            // add a new line between store outputs
            if (currKey !== numKeys && storeOutput !== '') {
                response += '\n';
            }
            currKey++;
        }
        // upload the extract to Azure as a blob
        const fileName = fileCreate.nameTmpFile(
            runType,
            CONSTANTS.RECORD_TYPE.STX,
            endDate
        );

        await fileUpload.createBlobFromString(fileName, response);
        return response;
    } catch (error) {
        LOGGER.error(`Error in runSTX() :: ${error}`);
        throw new Error(error);
    }
}

module.exports = {
    runSTX,
};
