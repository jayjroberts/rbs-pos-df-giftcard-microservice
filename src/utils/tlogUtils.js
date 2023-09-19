/**
 * @file tlogUtils.js
 * @author Valeria Molina Recinos
 * @date May 2023
 */

// Logger
const LOGGER = require('../logger/logger');

// constants
const CONSTANTS = require('../constants/constants');

/**
 * Create an object with each store's tlogs
 * { storeId: [{tlog}, {tlog}, ...]}
 * @param {Object} tlogs all the tlogs we got back from MongoDB
 * (this can be either daily or weekly)
 */
function extractLogsByStoreId(tlogs) {
    const logsByStore = {};
    // iterate and separate tlogs by storeId
    for (let log of tlogs) {
        // get storeId and add it to logsByStore
        const storeId = log.siteInfo.id;
        if (Object.keys(logsByStore).includes(storeId)) {
            // append to the list
            logsByStore[storeId].push(log);
        } else {
            // create a new entry with the store id as key
            // and an array of logs as values
            logsByStore[storeId] = [];
            logsByStore[storeId].push(log);
        }
    }
    return logsByStore;
}

/**
 * Convert an amount into the accepted
 * string format.
 * ex: 10.00 -> -0000001000
 * @param {Number} amount the amount to format
 * @returns {string} a string representation of the amount
 */
function createTotalAmountString(amount, negative) {
    // convert amount to string
    let roundAmount = Math.round((amount + Number.EPSILON) * 100) / 100; // rounding to 2 decimal places
    let strAmount = roundAmount.toFixed(2);
    // find decimal point and remove it
    strAmount = strAmount.replace('.', '');
    // remove the negative sign (if this is a negative amount)
    strAmount = strAmount.replace('-', '');
    const totalZeros = 10 - strAmount.length;
    // generate leading zeros
    const leadingZeros = new Array(totalZeros + 1).join('0');
    // return with a '-' if negative is true
    if (negative) {
        return `-${leadingZeros}${strAmount}`;
    }
    return `+${leadingZeros}${strAmount}`;
}

/**
 * Calculate how many bytes are needed to reach 128 total
 * @param {string} first
 * @param {string} second can be null
 * @returns {string} the padding
 */
function generatePadding(first, second) {
    // calculate how many bytes are needed to reach 128
    let currBytes;
    if (second) {
        currBytes = new Blob([first + second]).size;
    } else {
        currBytes = new Blob([first]).size;
    }
    const missingBytes = CONSTANTS.BYTE_LENGTH - currBytes;
    // generate padding and return
    return new Array(missingBytes + 1).join(' ');
}

/**
 * Calculate how many bytes are needed to pad field
 * @param {string} first
 * @param {string} second
 * @returns {string} the padding
 */
function addPaddedZeros(first, second) {
    let currBytes;
    let negative = false;
    if (first < 0) {
        negative = true;
        // remove the sign
        first = first * -1;
    }

    currBytes = new Blob([first]).size;
    const missingBytes = second - currBytes;
    // generate padding and return
    const padding = new Array(missingBytes).join('0');
    let sign;
    if (!negative) {
        sign = '+';
    } else {
        sign = '-';
    }

    return `${sign}${padding}${first}`;
}

/**
 * Calculate how many bytes are needed to pad field
 * @param {string} first
 * @param {string} second
 * @param {string} signed
 * @returns {string} the padding
 */
function formatString(first, second, signed) {
    let currBytes;
    let showSign = signed;
    let negative = false;
    if (first < 0) {
        negative = true;
        // remove the sign
        first = first * -1;
    }

    currBytes = new Blob([first]).size;
    const missingBytes = second - currBytes;
    // generate padding and return
    let padding;
    if (missingBytes === 1) {
        padding = '0';
    } else {
        padding = new Array(missingBytes).join('0');
    }
    let sign;
    let ret = `${padding}${first}`;

    if (parseInt(showSign) > 0) {
        if (!negative) {
            sign = '+';
        } else {
            sign = '-';
        }
        ret = `${sign}${ret}`;
    }

    return ret;
}

/**
 * Calculate how many bytes are needed to pad string to right
 * @param {string} first
 * @param {string} second
 * @returns {string} the padding
 */
function padString(first, second) {
    let currBytes;
    currBytes = new Blob([first]).size;
    const missingBytes = second - currBytes;
    let ret;

    // Sometimes the string is longer then the position allowed
    if (missingBytes <= 0) {
        first = first.slice(0, missingBytes);
        ret = `${first}`;
    } else {
        // generate padding and return
        const padding = new Array(missingBytes).join(' ');
        ret = `${first}${padding}`;
    }

    return ret;
}

/**
 * This helper function is used to calculate
 * the correct amount of padding for end descriptors in records
 * @param {String} desc the descriptor
 * @returns the correct amount of padding
 */
function descriptionAlignment(desc) {
    // The description at the end of a line
    // must be left justified and the total length
    // should be 18 bits
    let descLength = new Blob([desc]).size;
    const missingBytes = CONSTANTS.DESC_LENGTH - descLength;
    // generate the padding
    return new Array(missingBytes + 1).join(' ');
}

module.exports = {
    extractLogsByStoreId,
    createTotalAmountString,
    generatePadding,
    addPaddedZeros,
    formatString,
    padString,
    descriptionAlignment,
};
