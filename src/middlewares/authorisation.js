const { MESSAGES } = require('../config');
const db = require('../database/models');
const { UnauthorizedException } = require('../helpers/errorResponse');
const { jwt } = require('../utils');

module.exports = {
    validateAccessToken: (allowedRoles = []) => async (req, res, next) => {
    // Auth disabled for testing purposes
    // Optionally set a dummy user
    req.user = { id: null, role: allowedRoles[0] || null };
    return next();
},
    validateRefreshToken:
        (allowedRoles = []) =>
        async (req, res, next) => {
            try {
                if (!req.headers.authorization) throw new UnauthorizedException(MESSAGES.AUTH_ERRORS.TOKEN_HEADER);

                const token = req.headers.authorization.split(' ')[1]; // Extracting Bearer token from header.s
                if (!token) throw new UnauthorizedException(MESSAGES.ERROR.TOKEN);
                const decoded = await jwt.verifyRefreshToken(token);

                if (allowedRoles.includes(decoded.role)) {
                    req.user = decoded;
                    next();
                } else {
                    throw new UnauthorizedException(MESSAGES.ERROR.UNAUTHORIZED);
                }
            } catch (error) {
                next(error);
            }
        },
    optionalAuth: async (req, res, next) => {
        try {
            // If no authorization header, continue without attaching user
            if (!req.headers.authorization) {
                return next();
            }

            const token = req.headers.authorization.split(' ')[1];

            // If no token, continue without attaching user
            if (!token) {
                return next();
            }

            // Try to verify the token
            const decoded = await jwt.verifyAccessToken(token);

            // Verify user exists and is not deleted (only if UserModel is available)
            if (db.UserModel) {
                const user = await db.UserModel.findOne({ where: { id: decoded.id, deletedAt: null } });

                // If user exists and is not blocked, attach to request
                if (user && !user.isBlock) {
                    req.user = decoded;
                }
            } else {
                // User model not present in this build — attach decoded token but skip DB validation
                req.user = decoded;
            }

            // Always continue to next middleware
            next();
        } catch (error) {
            // If token verification fails, continue without attaching user
            // This allows the request to proceed as a public request
            next();
        }
    },
};
