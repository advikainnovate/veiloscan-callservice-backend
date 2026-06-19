const { apiKeyAuth, socketApiKeyAuth } = require('./authorisation');
const { trackCallRequest, trackChatRequest } = require('./tracking');
const { swaggerAuthenticate } = require('./swagger.middlewares');
const validation = require('./validation');

module.exports = {
    apiKeyAuth,
    socketApiKeyAuth,
    trackCallRequest,
    trackChatRequest,
    swaggerAuthenticate,
    validationMiddleware: validation,
};
