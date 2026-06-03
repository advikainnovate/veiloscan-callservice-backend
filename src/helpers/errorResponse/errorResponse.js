class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.type = 'Error';
        this.statusCode = statusCode;
    }
}

module.exports = ErrorResponse;
