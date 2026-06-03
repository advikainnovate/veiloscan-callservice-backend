const { HTTP_CODES } = require('../config');

const formatResponse = (res, success, statusCode, message = 'Success', data) =>
    res.status(statusCode).json({
        success,
        code: statusCode || HTTP_CODES.INTERNAL_SERVER_ERROR,
        message,
        data,
    });

// service response
exports.serviceResponse = (success, code, message, data = {}) => {
    return {
        success,
        code,
        message,
        data,
    };
};

// Success Response
exports.successResponse = (res, code, message, data) => formatResponse(res, true, code, message, data);

// Error Response
exports.errorResponse = (res, code, message, data) => formatResponse(res, false, code, message, data);

// Send Service Response (shared helper)
exports.sendServiceResponse = (res, response) => {
    if (!response.success) {
        return exports.errorResponse(res, response.code, response.message, response.data);
    }
    return exports.successResponse(res, response.code, response.message, response.data);
};
