const { HTTP_CODES } = require('../../config');

class NotFoundException extends Error {
    constructor(message) {
        super(message);
        this.type = 'Not Found';
        this.statusCode = HTTP_CODES.NOT_FOUND;
    }
}

module.exports = NotFoundException;
