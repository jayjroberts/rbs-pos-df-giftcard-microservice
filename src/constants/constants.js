/**
 * @file constants.js
 * @author Valeria Molina Recinos
 * @version 1.0.1
 *
 * This files stores all the constants we need in the server
 */

const MODEL = {
    TRANSACTIONS: 'canonicals',
};

const LINE_SIZE = 5;

const BYTE_LENGTH = 128;

const RUN = ['daily', 'weekly'];

const PARAMS = {
    RUN: 'run',
    DAILY: 'daily',
    WEEKLY: 'weekly',
};

const RECORD_TYPE = {
    STX: 'STX',
};

const ERROR_DESC = {
    MISSING_FIELD: 'Missing field',
    INVALID_FIELD: 'Invalid field',
    INVALID_RUN: "Accepted values: 'daily' or 'weekly'",
};

module.exports = {
    MODEL,
    LINE_SIZE,
    BYTE_LENGTH,
    RUN,
    PARAMS,
    ERROR_DESC,
    RECORD_TYPE,
};
