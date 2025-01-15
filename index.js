/**
 * @file index.js
 * entrypoint into the app
 * @version 1.0
 * @author Andrew Hanson
 */

// Express
const express = require('express');
const app = express();
const engines = require('consolidate');
const compression = require('compression');

// imports
const mongoose = require('mongoose');
const applicationPropertiesSingleton = require('./src/modules/applicationPropertiesSingleton');
const mongoURL = applicationPropertiesSingleton.VAR_MONGODB_DB;
const appPort = applicationPropertiesSingleton.VAR_APP_PORT;
const fileCreate = require('./src/utils/fileCreate');

// LOGGER
const LOGGER = require('./src/logger/logger');

// Mongoose
mongoose.Promise = global.Promise;
mongoose
    .connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => LOGGER.info(`Established connection to Mongo`));
mongoose.set('debug', true);

// express config
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json({ limit: '50mb', extended: true }));
app.engine('html', engines.nunjucks);
app.set('view engine', 'html');
app.use(compression());

// route
const gcRoute = require('./src/routes/gcRoute');


// route config
app.use(gcRoute);

// run server
const server = app.listen(appPort, () => {
    const { port } = server.address();
    LOGGER.info(`Server listening on port ${port}`);
});

module.exports = app;
