/**
 * @file index.js
 * @author Valeria Molina Recinos
 * @version 1.0.0
 * Entry point for microservices
 */

// express server configuration
const express = require('express');
const app = express();
const engines = require('consolidate');
const compression = require('compression');

// imports
const mongoose = require('mongoose');
const applicationPropertiesSingleton = require('./src/modules/applicationPropertiesSingleton');
const mongoUrl = applicationPropertiesSingleton.VAR_MONGODB_DB;
const appPort = applicationPropertiesSingleton.VAR_APP_PORT;

// LOGGER
const LOGGER = require('./src/logger/logger');

// Mongoose
mongoose.Promise = global.Promise;
mongoose
    .connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => LOGGER.info(`Established connection to MongoDB`))
    .catch((err) => LOGGER.error(`Unable to connect to MongoDB: ${err}`));
mongoose.set('debug', true);

// express config
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb', extended: true }));
app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.use(compression());

/**
 * Sanity check route to check that server is up and running
 */
app.get('/', (_, res) => {
    LOGGER.info(`Server is available and ready to receive requests`);
    res.send('OK');
});

// routes
const stxRoute = require('./src/routes/stxRoute');

// route configuration
app.use(stxRoute);

// run server
const server = app.listen(appPort, () => {
    const { port } = server.address();
    LOGGER.info(`Server listening on port ${port}`);
});

module.exports = app;
