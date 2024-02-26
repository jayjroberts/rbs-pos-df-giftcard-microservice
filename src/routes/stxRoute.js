/**
 * @file stxRoute.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 */

// router
const router = require('express').Router();

// validation
const { validationResult } = require('express-validator');
const { queryValidator } = require('../utils/validations');

// logger
const LOGGER = require('../logger/logger');

// constants
const CONSTANTS = require('../constants/constants');

// services
const stxService = require('../services/stxService');

/**
 * POST route for STX record creation
 * A query parameter specifying the runType is required
 * Accepted query parameters are: 'daily' or 'weekly'
 * Anything else is reated as a 400 error response
 */
router.post('/stx', queryValidator, async (req, res) => {
    // check that the request is valid
    LOGGER.info('Entering into POST /stx');
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            LOGGER.error(`Error with request query parameters`);
            res.status(400);
            res.json(errors.array());
        } else {
            let response;
            if (req.query.run === CONSTANTS.PARAMS.DAILY) {
                // run daily record
                response = await stxService.runSTX(CONSTANTS.PARAMS.DAILY).then((response) => response);
            } else if (req.query.run === CONSTANTS.PARAMS.WEEKLY) {
                // run weekly record
                response = await stxService.runSTX(CONSTANTS.PARAMS.WEEKLY).then((response) => response);
            } else {
                // run adhoc record
                const startDate = req.body.startDate;
                const endDate = req.body.endDate;
                response = await stxService.runSTX(
                    CONSTANTS.PARAMS.ADHOC,
                    startDate,
                    endDate
                ).then((response) => response);
            }
            res.send(response);
        }
    } catch (error) {
        LOGGER.error(`Unexpected server error: ${error.message}`);
        res.status(500);
        res.json({ error: error.message });
    }
});

module.exports = router;
