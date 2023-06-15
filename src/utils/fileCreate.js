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
 * @returns {string} the file name
 */
function nameTmpFile(runType, recordType) {
    // get the date
    let dt = new Date();
    dt.setDate(dt.getDate() - 1); // always use yesterday's date
    const date = ('0' + dt.getDate()).slice(-2);
    const month = ('0' + (dt.getMonth() + 1)).slice(-2);
    // check the run type
    if (runType === CONSTANTS.PARAMS.DAILY) {
        return `dly_${recordType}_${dt.getFullYear()}${month}${date}.dat`;
    } else {
        // weekly file type
        return `wk_${recordType}_${dt.getFullYear()}${month}${date}.dat`;
    }
}

module.exports = {
    nameTmpFile,
};
