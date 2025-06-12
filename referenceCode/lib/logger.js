import { createLogger, format, transports } from 'winston';
import _ from 'lodash';
import ENV from './envar.js';

const loggerDefaultOptions = {
    level: 'info',
    format: format.combine(
        format.timestamp(),
        format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [new transports.Console()]
};

const loggerConstructor = (options = {}, save = true, mute = false) => {
    // Merge user supplied options with defaults without mutating the defaults
    options = _.merge({}, loggerDefaultOptions, options);
    if (save) {
        let log2File = new transports.File({
            filename: 'server-log-' + new Date().toISOString().replace(/:/g, '-') + '.log'
        });
        options.transports.push(log2File);
    }
    options.silent = mute;
    return createLogger(options);
}

// Setup logger
var logger = loggerConstructor({}, ENV.SAVE_LOG, ENV.MUTE_LOG);

export default logger;
