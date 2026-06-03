require('dotenv').config();
const messages = require('./messages');
const constants = require('./constants');
const httpCodes = require('./httpCodes');
const config = require('./config');

module.exports = {
    CONSTANTS: constants,
    MESSAGES: messages,
    HTTP_CODES: httpCodes,
    CONFIG: config,
    ...require('./idPrefixes'),
};
