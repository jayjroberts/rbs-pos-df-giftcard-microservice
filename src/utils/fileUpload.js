/**
 * @author Valeria Molina Recinos
 * @version 1.0
 * April 2023
 */

const {
    BlobServiceClient,
    StorageSharedKeyCredential,
} = require('@azure/storage-blob');

// logger
const LOGGER = require('../logger/logger');

// env variables
const applicationPropertiesSingleton = require('../modules/applicationPropertiesSingleton');

// create azure credentials
const sharedKeyCredentials = new StorageSharedKeyCredential(
    applicationPropertiesSingleton.ACCOUNT_NAME,
    applicationPropertiesSingleton.KEY
);

const containerName = applicationPropertiesSingleton.CONTAINER_NAME;

const blobServiceClient = new BlobServiceClient(
    `https://${applicationPropertiesSingleton.ACCOUNT_NAME}.blob.core.windows.net`,
    sharedKeyCredentials
);

/**
 * Upload a file to Azure Storage as a blob
 * @param {string} filePath the path to the file
 * @param {string} fileName the name of the file
 */
async function uploadFileToBlob(filePath, fileName) {
    const containerClient = await blobServiceClient.getContainerClient(
        containerName
    );

    // create blobClient
    const blobClient = await containerClient.getBlockBlobClient(fileName);

    // upload file to blob storage
    try {
        await blobClient.uploadFile(filePath);
        LOGGER.debug(`${fileName} succeeded`);
    } catch (error) {
        LOGGER.error(`Failed to upload file to Azure Blob Storage :: ${error}`);
    }
}

/**
 * Create a Blob from a string and upload it to Azure Blob Storage
 * @param {string} fileName name of the file
 * @param {string} fileContentAsString file content
 */
async function createBlobFromString(fileName, fileContentAsString) {
    const containerClient = await blobServiceClient.getContainerClient(
        containerName
    );
    // create blobClient
    const blockBlobClient = await containerClient.getBlockBlobClient(fileName);

    // upload string
    try {
        await blockBlobClient.upload(
            fileContentAsString,
            fileContentAsString.length
        );
        LOGGER.debug(`${fileName} successfully uploaded to Azure Blob Storage`);
    } catch (err) {
        LOGGER.error(`Failed to upload to Azure Blob Storage :: ${err}`);
    }
}

module.exports = {
    uploadFileToBlob,
    createBlobFromString,
};
