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
            if (Object.keys(totalTaxes).includes(taxId)) {
                totalTaxes[taxId].sumOfTax += tax.amount.amount;
            } else {
                // create a new tax entry in totalTaxes object
                totalTaxes[taxId] = {
                    name: taxName,
                    sumOfTax: tax.amount.amount,
                    taxCollected: 0,
                    taxDiscounted: 0,
                };
            }
            // aggregate tax collected if there is no tax exempt amount available
            if (!tax.taxExempt) {
                // iterate through items in tlog object
                for (let item of tlog.tlog.items) {
                    // iterate through itemTaxes
                    for (let itemTax of item.itemTaxes) {
                        if (itemTax.id === taxId) {
                            // aggregate itemTaxes.amount.amount
                            totalTaxes[taxId].taxCollected +=
                                itemTax.amount.amount;
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
 * @param {string} runType 'daily' or 'weekly'
 * @returns {Array} an array containing all matching documents
 */
async function findStxTLogs(runType) {
    LOGGER.debug(`Entering into findStxTLogs()`);
    // set query and projection
    const query = {
        'tlog.transactionType': 'SALES',
        'tlog.isVoided': false,
        'tlog.isSuspended': false,
        'tlog.isRecalled': false,
    };

    const projection = {
        id: 1,
        'tlog.totalTaxes': 1,
        'tlog.items': 1,
        'siteInfo.id': 1,
    };

    // add different date ranges depending on the run type
    if (runType === CONSTANTS.PARAMS.DAILY) {
        // create the daily run query
        let start = new Date();
        start.setUTCHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 1); // always runs for yesterday

        let end = new Date();
        end.setUTCHours(23, 59, 59);
        end.setDate(end.getDate() - 1);
        // add to query
        query['openDateTimeUtc.dateTime'] = {
            $gte: start.toISOString(),
            $lte: end.toISOString(),
        };
    }
    if (runType === CONSTANTS.PARAMS.WEEKLY) {
        // transactions must be any date from the previous sunday to saturday
        let start = new Date();
        // get previous sunday date
        start.setUTCHours(0, 0, 0, 0);
        start.setDate(start.getDate() - 7);

        let end = new Date();
        // get saturday date
        end.setUTCHours(23, 59, 59);
        end.setDate(end.getDate() - 1);
        // add to query
        query['openDateTimeUtc.dateTime'] = {
            $gte: start.toISOString(),
            $lte: end.toISOString(),
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
 * @param {string} runType 'daily' or 'weekly'
 * @returns {string} a string containing the generated extract
 */
async function runSTX(runType) {
    try {
        let response = '';
        // find the matching tlogs
        const tlogs = await findStxTLogs(runType);

        // sort by store id
        const logsByStore = tlogUtils.extractLogsByStoreId(tlogs);

        for (let storeId of Object.keys(logsByStore)) {
            const totals = getTaxesPerStoreId(logsByStore[storeId]);
            LOGGER.debug(`Store ${storeId}`);
            LOGGER.debug(JSON.stringify(totals));
        }
        return logsByStore;
    } catch (error) {
        LOGGER.error(`Error in runSTX() :: ${error}`);
        throw new Error(error);
    }
}

module.exports = {
    runSTX,
};
