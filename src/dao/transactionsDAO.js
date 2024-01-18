/**
 * @file transactionsDAO
 * @author Valeria Molina Recinos
 * @version 1.0.0
 * Data Access Object file for transactions in mongodb
 */

const transactionsModel = require('../models/transactionsModel');
const LOGGER = require('../logger/logger');

/**
 * find transactions that match the given criteria
 * @param {Object} query filter to apply to transactions
 * @param {Object} projection can be null
 * @returns {Array} an array containing matching transactions
 */
async function findTransactions(query, projection) {
    LOGGER.debug(`Entering into findTransactions()`);
    try {
        const tlog = await transactionsModel.find(query, projection).lean();
        if (tlog) {
            // successfully found matching transactions
            return tlog;
        } else {
            LOGGER.error(`Could not find matching transactions`);
            throw new Error(`No matching transactions`);
        }
    } catch (error) {
        LOGGER.error(`Error in findTransactions() :: ${error}`);
        throw new Error(error);
    }
}

module.exports = {
    findTransactions,
};
