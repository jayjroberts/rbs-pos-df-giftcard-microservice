/**
 * @file fileCreate.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 */

const fs = require('fs');

// CONSTANTS
const CONSTANTS = require('../constants/constants');

// LOGGER
const LOGGER = require('../logger/logger');

/**
 * Create a tmp directory for storing the
 * generated files to be uploaded to azure blob storage
 */
function createDir() {
    fs.mkdirSync(
        process.cwd() + `/${CONSTANTS.FILE_DIRECTORY}`,
        { recursive: true },
        (error) => {
            if (error) {
                LOGGER.error('Error while creating tmp directory');
            } else {
                LOGGER.debug('Created tmp directory');
            }
        }
    );
}

/**
 * Given the naming convention for files, create the file name
 * @param {string} runType either weekly or daily
 * @return {string} the file name for this file
 */
function nameFile(runType) {
    // get the date
    let dt = new Date();
    dt.setDate(dt.getDate() - 1); // yesterday date
    const date = ('0' + dt.getDate()).slice(-2);
    const month = ('0' + (dt.getMonth() + 1)).slice(-2);
    // check the run type
    if (runType === CONSTANTS.PARAMS.DAILY) {
        return `dly_summary_tls_${dt.getFullYear()}${month}${date}.dat`;
    } else {
        // weekly
        return `wk_summary_tls_${dt.getFullYear()}${month}${date}.dat`;
    }
}

/**
 * A function to name a tmp file
 * containing a singular record type that' to
 * be uploaded to Azure Storage
 * @param {string} runType the type of record (smn, sma, etc...)
 * @param {string} recordType daily or weekly
 * @returns {string} name of the temporary file
 */
function nameTmpFile(runType, recordType) {
    // get the date
    let dt = new Date();
    dt.setDate(dt.getDate() - 1); // use yesterday's date
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

/**
 * This function creates the file to be uploaded to
 * Azure Blob Storage and stores in /tmp directory
 * @param {String} content the content inside the file
 * @param {String} fileName the name of the file
 */
function createFile(content, fileName) {
    fs.writeFile(
        `./${CONSTANTS.FILE_DIRECTORY}/${fileName}`,
        content,
        (error) => {
            if (error) {
                LOGGER.debug(
                    `Error while creating file: ${fileName} :: ${error}`
                );
            } else {
                LOGGER.debug(`Created file ${fileName}`);
            }
        }
    );
}

module.exports = {
    createFile,
    nameTmpFile,
    nameFile,
    createDir,
};
