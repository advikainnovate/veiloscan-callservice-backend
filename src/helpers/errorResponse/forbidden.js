const { HTTP_CODES } = require('../../config');

class ForbiddenException extends Error {
    constructor(message) {
        super(message);
        this.type = 'Forbidden';
        this.statusCode = HTTP_CODES.FORBIDDEN;
    }
}

module.exports = ForbiddenException;
