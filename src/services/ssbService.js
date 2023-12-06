/**
 * @file ssbService
 * @author Jason Roberts
 * @version 1.0.0
 */

// DAO
const transactionsDAO = require('../dao/transactionsDAO');

// constants
const CONSTANTS = require('../constants/constants');

// Logger
const LOGGER = require('../logger/logger');

// utils
const tlogUtils = require('../utils/tlogUtils');
const fileCreate = require('../utils/fileCreate');
const fileUpload = require('../utils/fileUpload');

/**
 * Add padding to each line in the
 * record type
 * @param {string} ssbOutput the output lines
 * @returns {string} each line, but padded
 */
function addPadding(ssbOutput) {
    let storeLineOutput = '';
    // split string by lines
    const lines = ssbOutput.split('\n');
    // iterate over each line
    for (let i = 0; i < lines.length; i++) {
        // check that the line is not empty
        // this can happen if there is only one line in the output
        if (lines[i] !== '') {
            // add padding to each line
            let splitLine = lines[i].split('|');
            const padding = tlogUtils.generatePadding(
                splitLine[0],
                splitLine[1]
            );
            storeLineOutput += `${splitLine[0]}${padding}${splitLine[1]}`;
            if (i !== lines.length - 1) {
                storeLineOutput += '\n';
            }
        }
    }
    return storeLineOutput;
}

/**
 * Generate the ssb output in the correct format
 * @param {object} totals an object containing the amounts b
 * @param {string} storeId the store number
 * @param {string} endDate optional for adhoc run
 * @returns {string} a string containing the formatted output
 */
function generatessbOutputPerStoreId(totals, storeId, endDate = null) {
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
    const wholeSaleAmount = totals.wholeSaleAmount;
    const nonTaxableAmount = totals.nonTaxableAmount;
    const taxAmounts = totals.taxAmounts;
    let s = '';
    let i = 0;

    while (i < taxAmounts.length) {
        s += taxAmounts[i];
        i++;
    }

    const joinInfo = `${s}${wholeSaleAmount}${nonTaxableAmount}`;

    // If all values are zero we will omit from adding it
    if (joinInfo !== CONSTANTS.EXEMPT_LINE) {
        str += joinInfo;
        str += `|${dt.getFullYear()}${month}${date}${storeId}SSB`;
        str += '\n';
    }

    return str;
}

/**
 * Calculate the total amounts in a set of tlogs
 * This function will go over each tlog and get the on-hand and O/S amounts for different medias and sales info
 * @param {Array} tlogs an array containing tlogs
 * @returns {object} an object containing the totals
 */
function calcSsbFields(tlogs,storeId) {
    let taxPlanAmount = new Array(8);
    let wholeSaleAmount = 0;
    let nonTaxableAmount = 0;
    let netMdseSales = 0;
    let tlTaxableSales = 0;
    let tlFSSales = 0;
    let tlWicSales = 0;
    // nonTaxableAmount = netMdseSales - tlTaxableSales - tlFSSales - tlWicSales - wholeSaleAmount

    // set each tax plan amount to 0
    for (let i = 0; i < taxPlanAmount.length; i++) {
        taxPlanAmount[i] = 0;
    }

    // iterate over each tlog
    for (let tlog of tlogs) 
    {
        if (
            tlog.tlog.isVoided !== 'true' &&
            tlog.tlog.isSuspended !== 'true' &&
            tlog.tlog.isOpen !== 'true'
        ) {
        // loop through item object and collect info
        // tlog.items.isReturn and tlog.items.itemTaxes.isRefund will need to be used
            for (let itm of tlog.tlog.items)
            {
                if (itm.itemTaxes.length > 0) 
                {
                    for (let tax of itm.itemTaxes) 
                    {
                        const taxIDArray = tax.id.split('-'); // tax plan 1 - 8
                        const taxId = taxIDArray[0] - 1; // array index starts at 0 so need to adjust tax plan to index
                        if(tax.isRefund == "true")
                        {
                            taxPlanAmount[taxId] -= Math.round(tax.taxableAmount.amount * 100);
                        }
                        else
                        {
                            taxPlanAmount[taxId] += Math.round(tax.taxableAmount.amount * 100);
                        }

                        // COLLECT WHOLESALE AMOUNT (net amount if taxexempt amount > 0)
                        if(typeof tax.taxExempt !== 'undefined' && tax.isVoided !== true)
                        {
                            if( tax.taxExempt.exemptAmount.amount > 0)
                            {
                                if(tax.isRefund == 'true')
                                {
                                    wholeSaleAmount -= Math.round(tax.taxableAmount.amount * 100);
                                }
                                else
                                {
                                    wholeSaleAmount += Math.round(tax.taxableAmount.amount * 100);
                                }    
                            }
                        }
                    }
                }   
            }
        }

        // COLLECT NET SALES AMOUNT
        netMdseSales += Math.round(tlog.tlog.totals.netAmount.amount * 100);
        // COLLECT TAXABLE AMOUNT
        if (tlog.tlog.totalTaxes.length > 0) 
        {
            for (let tax of tlog.tlog.totalTaxes) 
            {
                if(tax.amount.amount > 0)
                {
                    tlTaxableSales += Math.round(tax.taxableAmount.amount * 100);
                }        
            }
        }

        if (tlog.tlog.tenders.length > 0 ) 
        {
            for (let t of tlog.tlog.tenders)
            {
                if(t.usage === 'PAYMENT')
                {
                    switch (t.id) 
                    {
                        case 23:
                            // Foodstamps
                            tlFSSales += Math.round(t.tenderAmount.amount * 100);
                            break;
                        case 28:
                        case 48:
                            // wic
                            tlWicSales += Math.round(t.tenderAmount.amount * 100);
                            break;
                    }
                }
            }
        }
    }
    // Calculate nonTaxableAmount
    // ((@NetMdseSales + @eCom_MdseSales) - @TlTaxableSales - @TlFSSales - @TlWICSales - @TlTaxExempt)
    nonTaxableAmount =
        netMdseSales -
        tlTaxableSales -
        tlFSSales -
        tlWicSales -
        wholeSaleAmount;
    // Format amounts
    let i = 0;
    while (i < taxPlanAmount.length) 
    {
        taxPlanAmount[i] = tlogUtils.addPaddedZeros(
            parseInt(taxPlanAmount[i]),
            CONSTANTS.PADDED_FIELD_SIZE.TXPLANAMT
        );
        i++;
    }

    wholeSaleAmount = tlogUtils.addPaddedZeros(
        parseInt(wholeSaleAmount),
        CONSTANTS.PADDED_FIELD_SIZE.WHLSLAMT
    );

    nonTaxableAmount = tlogUtils.addPaddedZeros(
        parseInt(nonTaxableAmount),
        CONSTANTS.PADDED_FIELD_SIZE.NONTXBLAMT
    );

    const returnObj = {
        taxAmounts: taxPlanAmount,
        wholeSaleAmount: wholeSaleAmount,
        nonTaxableAmount: nonTaxableAmount,
    };
    return returnObj;
}

/**
 * finds the tlogs that match the criteria for ssb
 * @param {string} runType weekly or daily
 * @param {string} startDate optional, only for adhoc run
 * @param {string} endDate optional, only for adhoc run
 * @returns {Array} an array of documents that match
 */
async function findSsbTLogs(runType, startDate, endDate) {
    LOGGER.debug(`Entering into findSsbTLogs()`);
    // create query and projection
    const query = {
        'tlog.transactionType': { $in: ['SALES','RETURN'] },
        'tlog.isVoided': false,
        'tlog.isSuspended': false,
        'tlog.isRecalled': false,
        isTrainingMode: false,
    };

    const projection = {
        'siteInfo.id': 1,
        'tlog': 1,
        'transactionNumber':1,
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
    } catch (err) {
        LOGGER.error(`Error in findSsbTLogs() :: ${err}`);
        throw new Error(err);
    }
}

/**
 * This function execute all ssb calculations to generate extract
 * and uploads the file to azure storage
 * @param {string} runType 'daily', 'weekly', 'adhoc'
 * @param {string} startDate optional, only for adhoc runType
 * @param {string} endDate optional, only for adhoc runType
 * @returns {string} a string with the generated extract
 */
async function runSSB(runType, startDate = null, endDate = null) {
    // get the transactions from mongoDB
    let responseObj = '';
    try {
        const tlogs = await findSsbTLogs(runType, startDate, endDate);
        // sort tlogs by store id
        const logsByStore = tlogUtils.extractLogsByStoreId(tlogs);

        // calculate SSB fields for each store
        for (let storeId of Object.keys(logsByStore)) {
            const totals = calcSsbFields(logsByStore[storeId],storeId);

            const ssbOutput = generatessbOutputPerStoreId(
                totals,
                storeId,
                endDate
            );
            responseObj += ssbOutput;
        }

        //  before creating file, pad each line to match 128 bytes
        const storeLineOutput = addPadding(responseObj);

        // upload file to azure
        const filename = fileCreate.nameTmpFile(
            runType,
            CONSTANTS.RECORD_TYPE.SSB,
            endDate
        );

        await fileUpload.createBlobFromString(filename, storeLineOutput);

        return storeLineOutput;
    } catch (err) {
        LOGGER.error(`Error in runSSB() :: ${err}`);
        throw new Error(err);
    }
}

module.exports = {
    runSSB,
};
