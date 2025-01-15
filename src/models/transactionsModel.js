/**
 * @file transactionsModel
 * @author Valeria Molina Recinos
 * @version 1.0.0
 * @date April 2023
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
        eu: {
            id: String,
            path: [
                {
                    level: Number,
                    id: String,
                },
            ],
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
    tenant: {
        targetOrganizationName: String,
    },
    isUpdated: Boolean,
    transactionVersion: Number,
    tlog: {
        receiptId: String,
        receiptInfo: {
            contentType: String,
            encodingMethod: String,
            receiptData: String,
        },
        isVoided: Boolean,
        isSuspended: Boolean,
        transactionType: String,
        localCurrency: {
            code: String,
        },
        employees: [
            {
                id: String,
                name: String,
            },
        ],
        totals: {
            taxInclusive: {
                amount: Number,
            },
            taxExclusive: {
                amount: Number,
            },
            returnItemsTaxInclusive: {
                amount: Number,
            },
            returnItemsTaxExclusive: {
                amount: Number,
            },
            taxExemptAmount: {
                amount: Number,
            },
            discountAmount: {
                amount: Number,
            },
            grossAmount: {
                amount: Number,
            },
            grandAmount: {
                amount: Number,
            },
            voidsAmount: {
                amount: Number,
            },
            grossReturnsAmount: {
                amount: Number,
            },
            netAmount: {
                amount: Number,
            },
            wicInfo: {
                wicAmount: {
                    amount: Number,
                },
                notToExceedAmount: {
                    amount: Number,
                },
                notToExceedLostAmount: {
                    amount: Number,
                },
            },
        },
        loyaltyAccount: [],
        totalTaxes: [
            {
                id: String,
                name: String,
                taxAuthority: String,
                taxType: String,
                taxableAmount: {
                    amount: Number,
                },
                amount: {
                    amount: Number,
                },
                isRefund: Boolean,
                taxTypeCode: String,
                taxSaleTypeCode: String,
                isVoided: Boolean,
                sequenceNumber: String,
            },
        ],
        items: [
            {
                id: String,
                productId: String,
                productName: String,
                variations: [],
                departmentId: String,
                isReturn: Boolean,
                regularUnitPrice: {
                    amount: Number,
                    unitPriceQuantity: {
                        quantity: Number,
                        unitOfMeasurement: String,
                    },
                },
                extendedUnitPrice: {
                    amount: Number,
                    unitPriceQuantity: {
                        quantity: Number,
                        unitOfMeasurement: String,
                    },
                },
                actualUnitPrice: {
                    amount: Number,
                    unitPriceQuantity: {
                        quantity: Number,
                        unitOfMeasurement: String,
                    },
                },
                extendedAmount: {
                    amount: Number,
                },
                actualAmount: {
                    amount: Number,
                },
                quantity: {
                    quantity: Number,
                    unitOfMeasurement: String,
                    entryMethod: String,
                },
                isWeighted: Boolean,
                isOverridden: Boolean,
                itemPromotions: [],
                itemDiscounts: [],
                itemTenderRewards: [],
                itemTaxes: [
                    {
                        id: String,
                        name: String,
                        taxAuthority: String,
                        taxType: String,
                        taxableAmount: {
                            amount: Number,
                        },
                        amount: {
                            amount: Number,
                        },
                        isRefund: Boolean,
                        taxTypeCode: String,
                        isVoided: Boolean,
                        sequenceNumber: String,
                    },
                ],
                surcharges: [],
                itemSellType: String,
                beginDateTimeUtc: {
                    dateTime: String,
                    originalOffset: String,
                },
                endDateTimeUtc: {
                    dateTime: String,
                    originalOffset: String,
                },
                entryMethod: String,
                catalogItemCode: String,
                operatorBypassApprovals: [],
                inputIdentifierData: String,
                lineItemBreakdowns: [
                    {
                        lineNumbers: String,
                        price: {
                            amount: Number,
                            unitPriceQuantity: {
                                quantity: Number,
                            },
                        },
                    },
                ],
            },
        ],
        orders: [],
        tenders: [
            {
                id: String,
                name: String,
                type: String,
                typeLabel: String,
                tenderAmount: {
                    amount: Number,
                },
                usage: String,
                isVoided: Boolean,
                surcharges: [],
                authorizationCode: String,
                authorizationCodeLabel: String,
                lineNumber: Number,
                tenderAuthorization: {},
                tenderEndDateTime: {
                    dateTime: String,
                    originalOffset: String,
                },
                operatorBypassApprovals: [],
                tenderBenefitInfo: {
                    eligibleItems: [
                        {
                            purchasedUnits: Number,
                            itemCode: String,
                            purchasedQuantity: Number,
                            claimPrice: Number,
                            itemCodeLength: Number,
                            lineItemBreakdowns: [
                                {
                                    lineNumbers: String,
                                    price: {
                                        amount: Number,
                                    },
                                },
                            ],
                        },
                    ],
                },
                purses: [],
            },
        ],
        transactionPromotions: [],
        transactionDiscounts: [],
        coupons: [],
        surcharges: [],
        customerCount: Number,
        operatorBypassApprovals: [],
        isOpen: Boolean,
        customerPrograms: [],
    },
    transactionCategory: String,
    canonicalFormat: Boolean,
});

module.exports = mongoose.model(CONSTANTS.MODEL.TRANSACTIONS, transactionModel);
