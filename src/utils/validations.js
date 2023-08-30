/**
 * @file validations.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 */

const { check } = require('express-validator');

const CONSTANTS = require('../constants/constants');

// validate query parameters for routes
const validator = [
    check(CONSTANTS.PARAMS.RUN)
        .exists()
        .withMessage(CONSTANTS.ERROR_DESC.MISSING_FIELD)
        .isString()
        .withMessage(CONSTANTS.ERROR_DESC.INVALID_FIELD)
        .custom((value) => CONSTANTS.RUN.includes(value))
        .withMessage(CONSTANTS.ERROR_DESC.INVALID_RUN),
    check(CONSTANTS.BODY.START_DATE)
        .if(check(CONSTANTS.PARAMS.RUN).equals(CONSTANTS.PARAMS.ADHOC))
        .isString()
        .withMessage(CONSTANTS.ERROR_DESC.MISSING_START_DATE)
        .isDate()
        .withMessage(CONSTANTS.ERROR_DESC.INVALID_DATE),
    check(CONSTANTS.BODY.END_DATE)
        .if(check(CONSTANTS.PARAMS.RUN).equals(CONSTANTS.PARAMS.ADHOC))
        .isString()
        .withMessage(CONSTANTS.ERROR_DESC.MISSING_END_DATE)
        .isDate()
        .withMessage(CONSTANTS.ERROR_DESC.INVALID_DATE),
];

module.exports = {
    queryValidator: validator,
};
