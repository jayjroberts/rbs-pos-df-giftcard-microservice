/**
 * @file constants.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 */

/*
TODO: Remove Non_SALES

*/

// this holds the collection name for our Mongo DB
const MODEL = {
    TRANSACTIONS: 'canonicals',
    DEPARTMENTS: 'catalogues',
    NON_MERCH_DEPTS: 'nonmerchdepts',
};

const LINE_SIZE = 5;

const FILE_DIRECTORY = 'tmp';

const BYTE_LENGTH = 128;

const DESC_LENGTH = 18;

const RUN = ['daily', 'weekly', 'adhoc'];

const STRINGS = {
    NON_SALES: 'NON_SALES',
    SALES: 'SALES',
    NET_ITEMS: 'netItems',
    DEPARTMENT_ID: 'departmentId',
    ITEM_SELL_TYPE: 'itemSellType',
    EXTENDED_AMOUNT: 'extendedAmount',
    ACTUAL_AMOUNT: 'actualAmount',
    AMOUNT: 'amount',
    QUANTITY: 'quantity',
    CUSTOMER_COUNT: 'customerCount',
    IS_WEIGHTED: 'isWeighted',
};

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
    SDA: 'SDA',
    SDB: 'SDB',
    SDC: 'SDC'
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
    FILE_DIRECTORY,
    BYTE_LENGTH,
    DESC_LENGTH,
    RUN,
    PARAMS,
    BODY,
    ERROR_DESC,
    RECORD_TYPE,
    STRINGS,
};
