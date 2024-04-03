/**
 * @file ssbRoute.js
 * @author Jason Roberts
 * @version 1.0.0
 */

const router = require('express').Router();
const { validationResult } = require('express-validator');
const { queryValidator } = require('../utils/validations');
const LOGGER = require('../logger/logger');
const CONSTANTS = require('../constants/constants');
const ssbService = require('../services/ssbService');

/**
* GET endpoint to validate that the server is up and running
*/
router.get('/', (_, res) => {
    res.send('OK');
});

router.post('/ssb', queryValidator, async (req, res) => {
    // check that the request is valid
    LOGGER.info('Entering into POST /ssb');
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            LOGGER.error(`Error with request query parameters`);
            res.status(400);
            res.json(errors.array());
        } else {
            let response;
            if (req.query.run === CONSTANTS.PARAMS.DAILY) {
                response = await ssbService.runSSB(CONSTANTS.PARAMS.DAILY).then((response) => response);
            } else if (req.query.run === CONSTANTS.PARAMS.WEEKLY) {
                response = await ssbService.runSSB(CONSTANTS.PARAMS.WEEKLY).then((response) => response);
            } else {
                // run adhoc record
                const startDate = req.body.startDate;
                const endDate = req.body.endDate;
                response = await ssbService.runSSB(
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
