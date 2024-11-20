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
 * Generate STX output for a given store
 * @param {Object} totals totals object containing the tax totals for this store
 * @param {string} storeId store id
 * @param {string} endDate optional, only for adhoc run
 * @returns {string} string representation of the STX output
 */
function generateSTXOutputPerStoreId(totals, endDate = null) {
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
  
    totals.forEach( function(entry){
        //Format record as follows
        // tax plan number, taxable sales, tax collected, tax discounted, filler, desc, date, store rec
        let storeId = tlogUtils.formatString(entry['store'],4,0);
        if(entry['taxIdentifier'].includes("-"))
        {    
            let taxArray = entry['taxIdentifier'].split("-")
            let taxId = tlogUtils.formatString(taxArray[0],2,0);
            let taxSales = tlogUtils.formatString(Math.round(entry['taxableSales']*100),11,1);
            let taxAmount = tlogUtils.formatString(Math.round(entry['taxAmount']*100),11,1);
            let taxDiscount = tlogUtils.formatString(Math.round(entry['taxDiscount']*100),11,1);
           
            let str1 = `${taxId}${taxSales}${taxAmount}${taxDiscount}`;

            let desc = entry['desc'] + tlogUtils.descriptionAlignment(entry['desc']);
            if (desc.length > CONSTANTS.DESC_LENGTH) {
              // if descriptor length exceeds CONSTANTS.DESC_LENGTH,
              // then we need to truncate the descriptor
              desc = desc.substring(0, CONSTANTS.DESC_LENGTH);
          }
            let str2 = `${desc}${dt.getFullYear()}${month}${date}${storeId}${CONSTANTS.RECORD_TYPE.STX}`;

            // calculate filler space
            let padding = tlogUtils.generatePadding(str1,str2);
            str += `${str1}${padding}${str2}` + "\n";
            }
  
    });
    
    return str;
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
        const aggregation = await runAggregation(runType, startDate, endDate);
                    // generate output
            const storeOutput = generateSTXOutputPerStoreId(
                aggregation,
                endDate
            );
            // add it to the response
            response += storeOutput;
            
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

/**
 * Find the tlogs that matchda record type
 * @param {string} runType daily, weekly, or adhoc (custom run)
 * @param {string} startDate start date for custom run
 * @param {string} endDate end date for custom run
 * @returns {Array} an array of tlogs
 */

// new aggregation operator implementation
async function runAggregation(runType, startDate = null, endDate = null){
    try {
         // Initialize the base match criteria. Exclusions should be done at this 1st stage
         let baseMatch = {
            'transactionCategory': "SALE_OR_RETURN",
            'tlog.isVoided': false,
            'tlog.isSuspended': false,
            isTrainingMode: false,
        };
        
        // Add date criteria based on the run type
        if (runType === CONSTANTS.PARAMS.DAILY) {
            let start = new Date();
            start.setUTCHours(0, 0, 0);
            start.setDate(start.getDate() - 1);
            baseMatch['businessDay.dateTime'] = start.toISOString().split('.')[0] + 'Z';
        } else if (runType === CONSTANTS.PARAMS.WEEKLY) {
            // query must be any date from the previous sunday to saturday
            let start = new Date();
            start.setUTCHours(0, 0, 0);
            start.setDate(start.getDate() - 7);

            let end = new Date();
            end.setUTCHours(23, 59, 59);
            end.setDate(end.getDate() - 1);

            baseMatch['businessDay.dateTime'] = {
                $gte: start.toISOString().split('.')[0] + 'Z',
                $lte: end.toISOString().split('.')[0] + 'Z',
            };

        } else if (runType === CONSTANTS.PARAMS.ADHOC) {
            let start = new Date(startDate);
            start.setUTCHours(0, 0, 0, 0);

            let end = new Date(endDate);
            end.setUTCHours(0, 0, 0, 0);

            baseMatch['businessDay.dateTime'] = {
                $gte: start.toISOString().split('.')[0] + 'Z',
                $lte: end.toISOString().split('.')[0] + 'Z'
            };
        }
            
        const result = await transactionsDAO.aggregateTransactions([
          {
            '$match': baseMatch
          },
          {
            '$unwind': {
              'path': '$tlog.totalTaxes'
            }
          },
          {
            '$match': {
              'tlog.totalTaxes.isVoided': false
            }
          },
          {
            '$addFields': {
              'taxId': '$tlog.totalTaxes.id',
              'taxAmount': {
                '$cond': [
                  { '$eq': ['$tlog.totalTaxes.isRefund', true] },
                  { '$multiply': ['$tlog.totalTaxes.amount.amount', -1] },
                  '$tlog.totalTaxes.amount.amount'
                ]
              },
              'taxDiscAmount': {
                '$cond': [
                  { '$eq': ['$tlog.totalTaxes.isRefund', true] },
                  { '$multiply': ['$tlog.totalTaxes.taxExempt.amount', -1] },
                  '$tlog.totalTaxes.taxExempt.amount'
                ]
              },
              'taxableSales': {
                '$cond': [
                  { '$eq': ['$tlog.totalTaxes.isRefund', true] },
                  { '$multiply': ['$tlog.totalTaxes.taxableAmount.amount', -1] },
                  '$tlog.totalTaxes.taxableAmount.amount'
                ]
              },
              'taxExempt': '$tlog.totalTaxes.taxExempt.exemptTaxableAmount.amount'
            }
          },
          {
            '$group': {
              '_id': { '$concat': ['$siteInfo.id', '_', '$taxId'] },
              'store': { '$first': '$siteInfo.id' },
              'taxIdentifier': { '$first': '$taxId' },
              'desc': { '$first': '$tlog.totalTaxes.name' },
              'taxableSales': { '$sum': '$taxableSales' },
              'taxAmount': { '$sum': '$taxAmount' },
              'taxDiscount': { '$sum': '$taxDiscAmount' },
              'taxExempt': { '$sum': '$taxExempt' },
              'debugData': {
                '$push': {
                  '$concat': [
                    '$transactionNumber', ',', '$taxId', ',',
                    { '$toString': '$taxableSales' }, ',',
                    { '$toString': '$taxAmount' }
                  ]
                }
              }
            }
          },
          {
            '$addFields': {
              'taxableSales': {
                '$subtract': ['$taxableSales', '$taxExempt']
              }
            }
          },
          {
            '$sort': {
              'store': 1,
              'taxId': 1
            }
          },
          {
            '$project': {
              'store': 1,
              'taxIdentifier': 1,
              'desc': 1,
              'taxableSales': 1,
              'taxAmount': 1,
              'taxDiscount': 1
            }
          }
        ]);
        
        return result;
        
    }catch (err) {
        console.error("Error running aggregation:", err);
    }
}
module.exports = {
    runSTX,
};
