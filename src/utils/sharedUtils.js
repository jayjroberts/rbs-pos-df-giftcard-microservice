/**
 * @author Valeria Molina Recinos
 * @version 1.0.0
 * Shared functions between different record types
 */

// CONSTANTS
const CONSTANTS = require('../constants/constants');

/**
 * Calculate how many bytes are needed to reach 128
 * @param {string} first
 * @param {string} second can be null
 * @returns {string}
 */
function generatePadding(first, second) {
    // calculate how many bytes we need to reach 128
    let currentBytes;
    if (second) {
        currentBytes = new Blob([first + second]).size;
    } else {
        currentBytes = new Blob([first]).size;
    }
    const missingBytes = CONSTANTS.BYTE_LENGTH - currentBytes;
    // generate the padding bytes
    return new Array(missingBytes + 1).join(' ');
}

module.exports = {
    generatePadding,
};
