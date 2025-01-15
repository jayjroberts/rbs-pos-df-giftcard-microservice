/**
 * @author Valeria Molina Recinos
 * @date April 2023
 * @version 1.0
 * @copyright Ahold Delhaize 2023
 */

const envalid = require('envalid');
const ENV_CHOICES = ['development', 'production', 'qa', 'test'];
const { str, port } = envalid;

// Sanitizing env variables
const env = envalid.cleanEnv(process.env, {
    NODE_ENV: str({ choices: ENV_CHOICES }),
    WEBSITES_PORT: port(),
    WEBSITE_MONGODB_URL: str(),
    CONTAINER_NAME: str(),
    ACCOUNT_NAME: str(),
    KEY: str(),
    AZURE_STORAGE_CONNECTION_STRING: str(),
});

module.exports = {
    VAR_APP_PORT: env.WEBSITES_PORT,
    VAR_MONGODB_DB: env.WEBSITE_MONGODB_URL,
    CONTAINER_NAME: env.CONTAINER_NAME,
    ACCOUNT_NAME: env.ACCOUNT_NAME,
    KEY: env.KEY,
    AZURE_STORAGE_CONNECTION_STRING: env.AZURE_STORAGE_CONNECTION_STRING,
};
