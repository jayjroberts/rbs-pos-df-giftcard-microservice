/**
 * @file stxRoute.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 */

const router = require('express').Router();
const { validationResult } = require('express-validator');
const { queryValidator } = require('../utils/validations');
const LOGGER = require('../logger/logger');
const CONSTANTS = require('../constants/constants');
const stxService = require('../services/stxService');

router.post('/stx', queryValidator, async (req, res) => {
    // check that the request is valid
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            LOGGER.error(`Error with request query parameters`);
            res.status(400);
            res.json(errors.array());
        } else {
            let response;
            if (req.query.run === CONSTANTS.PARAMS.DAILY) {
                response = await stxService.runSTX(CONSTANTS.PARAMS.DAILY);
            } else {
                response = await stxService.runSTX(CONSTANTS.PARAMS.WEEKLY);
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
