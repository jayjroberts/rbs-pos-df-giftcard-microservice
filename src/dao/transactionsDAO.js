/**
 * @author Valeria Molina Recinos
 * @version 1.0.0
 * @date April 2023
 */

const transactionsModel = require('../models/transactionsModel');
const LOGGER = require('../logger/logger');

/**
 * find the transaction that corresponds to SDA type
 * @param {*} query - query to find documents
 * @param {*} projection - projection (can be null)
 * @returns {object} return SDA transactions
 */
async function findTransactions(query, projection) {
    LOGGER.debug(`Entering into findTransactions()`);
    try {
        const tlog = await transactionsModel.find(query, projection);
        if (tlog) {
            // this means we succesfully found SDA type tlogs, return
            return tlog;
        } else {
            LOGGER.error(`Could not find SDA tlogs`);
            // we got null back, we don't have any SDA tlogs
            throw new Error('No SDA tlogs found');
        }
    } catch (err) {
        LOGGER.error(`Error in findSDA() :: ${err}`);
        throw new Error(err);
    }
}

/**
 * Perform aggregation on transaction data.
 * @param {Array} pipeline - The MongoDB aggregation pipeline
 * @returns {Promise<Array>} - The result of the aggregation
 */
async function aggregateTransactions(pipeline) {
    LOGGER.debug(`Entering into aggregateTransactions()`);
    try {
        const result = await transactionsModel.aggregate(pipeline);
        LOGGER.debug('Aggregation result:', result);
        return result;
    } catch (err) {
        LOGGER.error(`Error in aggregateTransactions() :: ${err}`);
        throw new Error(err);
    }
}



module.exports = {
    findTransactions,
    aggregateTransactions,
};