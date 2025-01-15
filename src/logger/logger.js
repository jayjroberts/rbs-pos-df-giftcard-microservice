/**
 * File Name: logger.js
 * @author: Bismark
 * createdDate: 01/17/2020
 * Usuage: logger
 * @copyright Ahold USA 2020
 */
const path = require('path');
const winston = require('winston');
const timezone = process.env.TZ || 'America/New_York';
const moment = require('moment-timezone');
moment.tz.setDefault(timezone);

function formatParams(info) {
    const { timestamp, level, message, ...args } = info;
    const ts = timestamp.slice(0, 19).replace('T', ' ');
    return `${ts} ${level}: ${message} ${
        Object.keys(args).length ? JSON.stringify(args, '', '') : ''
    }`;
}

const options = {
    file: {
        level: 'info',
        filename: `${path.resolve('.')}/logs/server-${moment().format(
            'MM-DD-YYYY'
        )}.log`,
        handleExceptions: true,
        json: true,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
        colorize: false,
    },
    console: {
        level: 'debug',
        handleExceptions: true,
        json: false,
        colorize: true,
    },
};

const enumerateErrorFormat = winston.format((info) => {
    if (info instanceof Error) {
        Object.assign(info, { message: info.stack });
    }
    return info;
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        enumerateErrorFormat(),
        process.env.NODE_ENV === 'development'
            ? winston.format.colorize()
            : winston.format.uncolorize(),
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.align(),
        winston.format.splat(),
        winston.format.printf(
            formatParams,
            ({ level, message }) => `${level}: ${message}`
        )
    ),
    transports: [
        new winston.transports.File(options.file),
        new winston.transports.Console(options.console),
        // new winston.transports.Console({
        //   stderrLevels: ['error'],
        // }),
    ],
});
module.exports = logger;
