/**
 * Functions that are shared between
 * different record types
 */


// constants
const CONSTANTS = require('../constants/constants');


/**
 * Create an object with each store's tlogs
 * { storeId: [{tlog}, {tlog}, ...]}
 * @param {Object} tlogs all the tlogs we got back from MongoDB
 * (this can be either daily or weekly)
 * @return {object}
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
 * Convert an amount into the accepted string
 * remove the decimal point
 * and add leading 0's to total 10 digits
 * the amount should start with + or - sign
 * depending if it's a positive or negative amount
 * or if the dept id is non-merch
 * @param {String} amount the amount to convert
 * @return {string}
 */

function createTotalAmountString(amount) {
    // convert amount to string
    let strAmount = amount.toString();
    // find decimal point and remove it
    strAmount = strAmount.replace('.', '');
    // if there is a negative sign, remove it as well
    strAmount = strAmount.replace('-', '');
    // calculate how many 0s we must add
    const totalZeros = 10 - strAmount.length;
    // generate leading 0's
    const leadingZeros = new Array(totalZeros + 1).join('0');
    // check the sign of the number and return depending on this   
    if (amount < 0) {
        return `-${leadingZeros}${strAmount}`;
    }
    // otherwise return with a positive sign
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
 * convert net items amount into expected string format
 * 
 * Convert the amount of net items into the expected
 * string format and add leading 0's to total 10 digits
 * the amount should start with + or - sign depending on the sign of the amount
 * @param {Number} netAmount
 * @returns {string} amount in string format
 */
function createIntegerString(netAmount) {
    //get units (netAmount)
    netAmount = Math.round(netAmount);

    let strAmount = netAmount.toString();

    // if there is a negative sign, remove it
    strAmount = strAmount.replace('-', '');
    // calculate the number of 0's to add
    const totalZeros = 10 - strAmount.length;
    // generate leading 0's
    const leadingZeros = new Array(totalZeros + 1).join('0');
    // check the sign of the number and return depending on this
    if (Math.sign(netAmount) === -1) {
        // if negative return with a leading -
        return `-${leadingZeros}${strAmount}`;
    }
    // otherwise return with a leading +
    return `+${leadingZeros}${strAmount}`;
}

/**
 * Add padding to each line in the
 * record type
 * @param {string} output the output lines
 * @returns {string} each line, but padded
 */
function addPadding(output) {
    let storeLineOutput = '';
    // split string by lines
    const lines = output.split('\n');
    // iterate over each line
    for (let i = 0; i < lines.length; i++) {
        // check that the line is not empty
        // this can happen if there is only one line in the output
        if (lines[i] !== '') {
            // add padding to each line
            let splitLine = lines[i].split('|');
            const padding = tlogUtils.generatePadding(
                splitLine[0],
                splitLine[1]
            );
            storeLineOutput += `${splitLine[0]}${padding}${splitLine[1]}`;
            if (i !== lines.length - 1) {
                storeLineOutput += '\n';
            }
        }
    }
    return storeLineOutput;
}


/**
 * This helper function is used to calculate
 * the correct amount of padding for end descriptors in records
 * @param {String} desc the descriptor
 * @returns the correct amount of padding
 */
function descriptionAlignment(desc) {
    let newDesc;
    // The description at the end of a line
    // must be left justified and the total length
    // should be 18 bits
    let descLength = new Blob([desc]).size;
    if(descLength > CONSTANTS.DESC_LENGTH){
        // trim to length
        newDesc = desc.substring(0,CONSTANTS.DESC_LENGTH);
    }
    else
    {
        //pad to length
        const missingBytes = CONSTANTS.DESC_LENGTH - descLength;
        newDesc  = desc + new Array(missingBytes + 1).join(' ');

    }
  
    return newDesc;
}

module.exports = {
    extractLogsByStoreId,
    addPadding,
    createTotalAmountString,
    createIntegerString,
    descriptionAlignment,
    addPaddedZeros,
    generatePadding

};
