const basicAuth = require('basic-auth');
const { CONFIG } = require('../config');
exports.swaggerAuthenticate = (req, res, next) => {
    const credentials = basicAuth(req);
    if (!credentials || credentials.name !== CONFIG.APP.SW_USERNAME || credentials.pass !== CONFIG.APP.SW_PASSWORD) {
        res.set('WWW-Authenticate', 'Basic realm="example"');
        return res.status(401).send('Authentication required.');
    }
    next();
};
