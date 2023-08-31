/**
 * @file fileCreate.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 * May 2023
 */

// constants
const CONSTANTS = require('../constants/constants');

/**
 * A function to name the tmp file that will
 * be upload to Azure storage
 * @param {string} runType the type of record
 * @param {string} recordType daily or weekly
 * @param {string} endDate optional parameter for adhoc run
 * @returns {string} the file name
 */
function nameTmpFile(runType, recordType, endDate = null) {
    // get the date
    let dt;
    if (endDate) {
        dt = new Date(endDate);
    } else {
        dt = new Date();
        dt.setDate(dt.getDate() - 1); // set date to yesterday
    }
    const date = ('0' + dt.getUTCDate()).slice(-2);
    const month = ('0' + (dt.getUTCMonth() + 1)).slice(-2);
    // check the run type
    if (runType === CONSTANTS.PARAMS.DAILY) {
        return `dly_${recordType}_${dt.getFullYear()}${month}${date}.dat`;
    } else if (runType === CONSTANTS.PARAMS.WEEKLY) {
        // weekly file type
        return `wk_${recordType}_${dt.getFullYear()}${month}${date}.dat`;
    } else {
        // adhoc file type
        return `adhoc_${recordType}_${dt.getFullYear()}${month}${date}.dat`;
    }
}

module.exports = {
    nameTmpFile,
};
