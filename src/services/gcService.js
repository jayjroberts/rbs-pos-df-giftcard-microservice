/**
 * @version 1.0.0
 * @author Andrew Hanson
 * @file sdcService.js
 */

// DAO
const transactionsDAO = require('../dao/transactionsDAO');

// constants
const CONSTANTS = require('../constants/constants');

// utils
const tlogUtils = require('../utils/tlogUtils');

// Logger
const LOGGER = require('../logger/logger');



// file utils
const fileCreate = require('../utils/fileCreate');
const fileUpload = require('../utils/fileUpload');

/** 
 * Generate the SDC output as required
 * @param {Object} totals object containing totals by dept id
 * @param {string} storeId store number
 * @returns {string} the formatted string
 */
function generateSDCOutputPerStoreId(totals, endDate = null) {
    let str = '';
    let dt = endDate ? new Date(endDate) : new Date();
    dt.setDate(dt.getDate() - (endDate ? 0 : 1));  // Adjust date to yesterday if no endDate provided
    const date = ('0' + dt.getUTCDate()).slice(-2);
    const month = ('0' + (dt.getUTCMonth() + 1)).slice(-2);

    for(const entry in totals){
        let storeId = totals[entry]['store'];
        let deptDescription = "NET TOTALS";
        
         let netSales = tlogUtils.createTotalAmountString( Math.round(totals[entry]["netSales"]*100));
         let numberItems = tlogUtils.createTotalAmountString(totals[entry]['numberItems']);
         let custCount = tlogUtils.createTotalAmountString(totals[entry]['custCount']);
         let netPctg = "+0001000000";


         // left align the end descriptor with correct padding
         deptDescription =
             tlogUtils.descriptionAlignment(deptDescription);
  
         // calculate padding
         let padding = tlogUtils.generatePadding(
             `${numberItems}${netSales}${netPctg}${custCount}${netPctg}`,
             `${deptDescription}${dt.getFullYear()}${month}${date}${storeId}${
                 CONSTANTS.RECORD_TYPE.SDC
             }`
         );
         
         let joinInfo = `${numberItems}${netSales}${netPctg}${custCount}${netPctg}${padding}${deptDescription}${dt.getFullYear()}${month}${date}${storeId}${
             CONSTANTS.RECORD_TYPE.SDC
         }\n`;
         str += joinInfo;
    }
    return str;
}


/**
 * Trigger the logic for generating sdc record types
 * @param {string} runType weekly, daily or adhoc (custom date range)
 * @returns {string} a string containing the sdc record
 * @param {String} deptId
 */
async function runSDC(runType, startDate = null, endDate = null) {
    LOGGER.debug('entering into runSDC...');
    try {
        let response = '';
        // get net items, actual amount, customer count by department id
        const aggregation = await runAggregation(runType, startDate, endDate);

        // convert to string reprentation
        const sdcOutput = generateSDCOutputPerStoreId(aggregation,endDate);
        response += sdcOutput;

        const storeLineOutput = response;

        // create a tmp file and upload to Azure as blob
        const filename = fileCreate.nameTmpFile(runType,CONSTANTS.RECORD_TYPE.SDC, endDate);

        // create a blob from string and upload to azure
        await fileUpload.createBlobFromString(filename, storeLineOutput);
        return storeLineOutput;
    } catch (error) {
        LOGGER.error(`Error in runSDC() :: ${error}`);
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
              }, {
                '$unwind': {
                  'path': '$tlog.items'
                }
              }, {
                '$match': {
                  'tlog.items.itemSellType': 'SALES'
                }
              }, {
                '$addFields': {
                  'amount': '$tlog.items.actualAmount.amount', 
                  'quantity': {
                    '$cond': {
                      'if': {
                        '$eq': [
                          '$tlog.items.isWeighted', true
                        ]
                      }, 
                      'then': 1, 
                      'else': '$tlog.items.quantity.quantity'
                    }
                  }
                }
              }, {
                '$addFields': {
                  'amt': {
                    '$cond': [
                      {
                        '$eq': [
                          '$tlog.items.isReturn', true
                        ]
                      }, {
                        '$multiply': [
                          '$amount', -1
                        ]
                      }, '$amount'
                    ]
                  }, 
                  'qty': {
                    '$cond': [
                      {
                        '$eq': [
                          '$tlog.items.isReturn', true
                        ]
                      }, {
                        '$multiply': [
                          '$quantity', -1
                        ]
                      }, '$quantity'
                    ]
                  }, 
                  'countCustomer': {
                    '$cond': [
                      {
                        '$eq': [
                          '$tlog.items.isReturn', true
                        ]
                      }, 0, 1
                    ]
                  }, 
                  'tid': '$id', 
                  'dept': {
                    '$arrayElemAt': [
                      {
                        '$split': [
                          '$tlog.items.departmentId', '-'
                        ]
                      }, 2
                    ]
                  }
                }
              }, {
                '$match': {
                  'dept': {
                    '$ne': '1123'
                  }
                }
              }, {
                '$group': {
                  '_id': '$tid', 
                  'store': {
                    '$first': '$siteInfo.id'
                  }, 
                  'transactionNumber': {
                    '$first': '$transactionNumber'
                  }, 
                  'touchPointId': {
                    '$first': '$touchPointId'
                  }, 
                  'dept': {
                    '$first': '$dept'
                  }, 
                  'totalAmount': {
                    '$sum': '$amt'
                  }, 
                  'totalQty': {
                    '$sum': '$qty'
                  }, 
                  'ticketCount': {
                    '$max': '$countCustomer'
                  }
                }
              }, {
                '$addFields': {
                  'id': '$store', 
                  'totalAmount': {
                    '$toDouble': '$totalAmount'
                  }
                }
              }, {
                '$project': {
                  'id': 1, 
                  'store': 1, 
                  'transactionNumber': 1, 
                  'touchPointId': 1, 
                  'dept': 1, 
                  'deptDesc': 1, 
                  'totalAmount': 1, 
                  'totalQty': 1, 
                  'ticketCount': 1
                }
              }, {
                '$group': {
                  '_id': '$id', 
                  'store': {
                    '$first': '$store'
                  }, 
                  'netSales': {
                    '$sum': '$totalAmount'
                  }, 
                  'numberItems': {
                    '$sum': '$totalQty'
                  }, 
                  'custCount': {
                    '$sum': '$ticketCount'
                  }
                }
              }, {
                '$sort': {
                  'store': 1, 
                  '_id': 1
                }
              }, {
                '$project': {
                  'store': 1, 
                  'numberItems': 1, 
                  'netSales': 1, 
                  'custCount': 1
                }
              }
            ]);
        return result;
        
    }catch (err) {
        console.error("Error running aggregation:", err);
    }

}
      

module.exports = {
    runSDC,
};