const { HTTP_CODES } = require('../../config');

class UnHandledException extends Error {
    constructor(err = null) {
        const message = 'Internal Server Error';
        super(message);
        this.type = 'Internal Server Error';
        this.err = err;
        this.statusCode = HTTP_CODES.INTERNAL_SERVER_ERROR;
    }
}

module.exports = UnHandledException;
