const { HTTP_CODES } = require('../../config');

class PreconditionException extends Error {
    constructor(message, err = null) {
        super(message);
        this.type = 'Precondition Failed';
        this.statusCode = HTTP_CODES.PRECONDITION_FAILED;
        this.err = err;
    }
}

module.exports = PreconditionException;
