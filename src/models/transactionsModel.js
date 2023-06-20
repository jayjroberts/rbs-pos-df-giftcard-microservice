/**
 * @file transactionsModel
 * @author Valeria Molina Recinos
 * @version 1.0.0
 * @date May 2023
 */

const mongoose = require('mongoose');
const CONSTANTS = require('../constants/constants');

const { Schema } = mongoose;

/**
 * The transaction model
 */
const transactionModel = new Schema({
    id: String,
    modelVersion: Number,
    siteInfo: {
        name: String,
        id: String,
        siteTimeZone: {
            timeZone: String,
        },
    },
    transactionNumber: String,
    openDateTimeUtc: {
        dateTime: String,
        originalOffset: String,
    },
    closeDateTimeUtc: {
        dateTime: String,
        originalOffset: String,
    },
    touchPointId: String,
    touchPointType: String,
    touchPointGroup: String,
    dataProviderName: String,
    dataProviderVersion: String,
    dataContentType: String,
    businessDay: {
        dateTime: String,
        originalOffset: String,
    },
    isTrainingMode: Boolean,
    linkedTransactions: [],
    isUpdated: Boolean,
    transactionVersion: Number,
    tlog: Object,
    transactionCategory: String,
});

module.exports = mongoose.model(CONSTANTS.MODEL.TRANSACTIONS, transactionModel);
