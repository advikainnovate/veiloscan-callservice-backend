const { HTTP_CODES, MESSAGES } = require('../config');
const { errorResponse } = require('./response');

exports.routeHandler = async (req, res) => {
    errorResponse(res, HTTP_CODES.NOT_FOUND, MESSAGES.ERROR.ROUTE_NOT_FOUND);
};
