const jwt = require('jsonwebtoken');
const { CONFIG } = require('../config');
const { UnauthorizedException } = require('../helpers/errorResponse');

/**
 * Admin JWT middleware.
 * Expects: Authorization: Bearer <token>
 * Token must carry { role: 'admin' }
 */
const adminAuth = (req, res, next) => {
    try {
        const header = req.headers['authorization'] || '';
        const token  = header.startsWith('Bearer ') ? header.slice(7) : null;

        if (!token) throw new UnauthorizedException('Admin token required');

        const payload = jwt.verify(token, CONFIG.JWT.ACCESS_TOKEN_SECRET);

        if (payload.role !== 'admin') {
            throw new UnauthorizedException('Admin access only');
        }

        req.admin = payload;
        next();
    } catch (err) {
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return next(new UnauthorizedException('Invalid or expired admin token'));
        }
        next(err);
    }
};

module.exports = { adminAuth };
