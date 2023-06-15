/**
 * @file validations.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 */

const { query } = require('express-validator');

const CONSTANTS = require('../constants/constants');

// validate query parameters for routes
const queryValidator = [
    query(CONSTANTS.PARAMS.RUN)
        .exists()
        .withMessage(CONSTANTS.ERROR_DESC.MISSING_FIELD)
        .isString()
        .withMessage(CONSTANTS.ERROR_DESC.INVALID_FIELD)
        .custom((value) => CONSTANTS.RUN.includes(value))
        .withMessage(CONSTANTS.ERROR_DESC.INVALID_RUN),
];

module.exports = {
    queryValidator,
};
