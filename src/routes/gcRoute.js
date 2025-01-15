/**
 * @version 1.0.0
 * @file gcRoute
 * @author Jason Roberts
 */

// express validator
const { validationResult } = require('express-validator');

// router
const router = require('express').Router();

// logger
const LOGGER = require('../logger/logger');

// constants
const CONSTANTS = require('../constants/constants');

// sd service
const sdcService = require('../services/gcService');

// validation
const { validator } = require('../utils/validations');


/**
* GET endpoint to validate that the server is up and running
*/
router.get('/', (_, res) => {
    res.send('OK');
});

/**
 * POST endpoint that will create the SDC file and
 * send over back as a string
 */
router.post('/sdc', validator, async (req, res) => {
    LOGGER.info('Entering into POST /sdc');

    // check if this is a weekly or daily file
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        LOGGER.error(`Error with request query parameters.`);
        res.status(400);
        res.json(errors.array());
    } else {
        let response;
        // accepted run type: daily, weekly or adhoc
        try {
            if (req.query.run === CONSTANTS.PARAMS.DAILY) {
                // run sdc record from yesterday
                response = await sdcService.runSDC(CONSTANTS.PARAMS.DAILY).then((response) => response);
            } else if (req.query.run === CONSTANTS.PARAMS.WEEKLY) {
                // run sdc record from the previous week
                response = await sdcService.runSDC(CONSTANTS.PARAMS.WEEKLY).then((response) => response);
            } else {
                // run adhoc record
                const startDate = req.body.startDate;
                const endDate = req.body.endDate;
                response = await sdcService.runSDC(
                    CONSTANTS.PARAMS.ADHOC,
                    startDate,
                    endDate
                ).then((response) => response);
            }
            res.send(response);
        } catch (error) {
            LOGGER.error(`Internal Server Error :: ${error}`);
            res.status(500);
            res.send(`Internal Server Error`);
        }
    }
});

module.exports = router;
