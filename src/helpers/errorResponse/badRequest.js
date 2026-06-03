const { HTTP_CODES } = require('../../config');

class BadRequestException extends Error {
    constructor(message, err = null) {
        super(message);
        this.type = 'Bad Request';
        this.statusCode = HTTP_CODES.BAD_REQUEST;
        this.err = err;
    }
}

module.exports = BadRequestException;
