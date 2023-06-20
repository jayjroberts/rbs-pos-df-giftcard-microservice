/**
 * @file fileUpload.js
 * @author Valeria Molina Recinos
 * May 2023
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

// get the container name
const containerName = applicationPropertiesSingleton.CONTAINER_NAME;

const blobServiceClient = new BlobServiceClient(
    `https://${applicationPropertiesSingleton.ACCOUNT_NAME}.blob.core.windows.net`,
    sharedKeyCredentials
);

async function createBlobFromString(filename, fileContentAsString) {
    const containerClient = await blobServiceClient.getContainerClient(
        containerName
    );

    // create a blob client
    const blockBlobClient = await containerClient.getBlockBlobClient(filename);

    // upload string
    try {
        await blockBlobClient.upload(
            fileContentAsString,
            fileContentAsString.length
        );
        LOGGER.info(`${filename} successfully uploaded to Azure Blob Storage`);
    } catch (error) {
        LOGGER.error(`Failed to upload to Azure Blob Storage :: ${error}`);
    }
}

module.exports = {
    createBlobFromString,
};
