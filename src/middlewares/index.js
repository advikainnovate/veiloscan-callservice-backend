const validation = require('./validation');
module.exports = {
    ...require('./authorisation'),
    validationMiddleware: validation,
};
