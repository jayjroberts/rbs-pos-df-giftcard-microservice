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

async function findStxTLogs(runType) {
    LOGGER.debug(`Entering into findStxTLogs()`);
    // set query and projection
    const query = {
        'tlog.transactionType': 'SALES',
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

async function runSTX(runType) {
    try {
        let response = '';
        // find the matching tlogs
        const tlogs = await findStxTLogs(runType);

        // sort by store id
        const logsByStore = tlogUtils.extractLogsByStoreId(tlogs);
        return logsByStore;
    } catch (error) {
        LOGGER.error(`Error in runSTX() :: ${error}`);
        throw new Error(error);
    }
}

module.exports = {
    runSTX,
};
