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

const DESC_LENGTH = 18;

const RUN = ['daily', 'weekly', 'adhoc'];

const PARAMS = {
    RUN: 'run',
    DAILY: 'daily',
    WEEKLY: 'weekly',
    ADHOC: 'adhoc',
};

const BODY = {
    START_DATE: 'startDate',
    END_DATE: 'endDate',
};

const RECORD_TYPE = {
    STX: 'STX',
    SSB: 'SSB',
};

const PADDED_FIELD_SIZE = {
    TXPLANAMT: 11,
    WHLSLAMT: 11,
    NONTXBLAMT: 11,
};

const ERROR_DESC = {
    MISSING_FIELD: 'Missing field',
    INVALID_FIELD: 'Invalid field',
    INVALID_RUN: "Accepted values: 'daily', 'weekly', 'adhoc",
    MISSING_START_DATE: 'Missing startDate param in body',
    MISSING_END_DATE: 'Missing endDate param in body',
    INVALID_DATE: 'Invalid date format. Expected YYYY-MM-DD or YYYY/MM/DD',
};

module.exports = {
    MODEL,
    LINE_SIZE,
    BYTE_LENGTH,
    DESC_LENGTH,
    RUN,
    PARAMS,
    BODY,
    ERROR_DESC,
    RECORD_TYPE,
    PADDED_FIELD_SIZE,
};
