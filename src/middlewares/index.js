const { apiKeyAuth, socketApiKeyAuth } = require('./authorisation');
const { trackCallRequest, trackChatRequest } = require('./tracking');
const { swaggerAuthenticate } = require('./swagger.middlewares');
const { adminAuth } = require('./adminAuth');
const validation = require('./validation');

module.exports = {
    apiKeyAuth,
    socketApiKeyAuth,
    trackCallRequest,
    trackChatRequest,
    swaggerAuthenticate,
    adminAuth,
    validationMiddleware: validation,
};
