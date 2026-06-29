const rateLimit = require('express-rate-limit');

/**
 * Strict limiter for admin login — 10 attempts per 15 minutes per IP
 */
const adminLoginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Try again in 15 minutes.' },
});

/**
 * Limiter for public org bootstrap endpoints (create org, create API key)
 * 20 requests per hour per IP
 */
const publicOrgLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests. Try again later.' },
});

module.exports = { adminLoginLimiter, publicOrgLimiter };
