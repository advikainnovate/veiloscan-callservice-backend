const { CONFIG } = require('../config');
const { BadRequestException } = require('../helpers');
const jwt = require('jsonwebtoken');

exports.verifyAccessToken = (token) => {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
        jwt.verify(token, CONFIG.JWT.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) throw new BadRequestException('Invalid Token');
            resolve(decoded);
        });
    });
};

exports.verifyRefreshToken = (token) => {
    // eslint-disable-next-line no-unused-vars
    return new Promise((resolve, reject) => {
        jwt.verify(token, CONFIG.JWT.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err) throw new BadRequestException('Invalid Token');
            resolve(decoded);
        });
    });
};

exports.generateAccessToken = (payload) => {
    return jwt.sign({ ...payload }, CONFIG.JWT.ACCESS_TOKEN_SECRET, {
        expiresIn: CONFIG.JWT.ACCESS_TOKEN_TIME,
    });
};

exports.generateRefreshToken = (payload) => {
    return jwt.sign({ ...payload }, CONFIG.JWT.REFRESH_TOKEN_SECRET, {
        expiresIn: CONFIG.JWT.REFRESH_TOKEN_TIME,
    });
};

exports.generateResetToken = (payload) => {
    return jwt.sign({ ...payload, type: 'reset' }, CONFIG.JWT.ACCESS_TOKEN_SECRET, {
        expiresIn: CONFIG.JWT.RESET_TOKEN_TIME,
    });
};

exports.verifyResetToken = (token) => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, CONFIG.JWT.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err || !decoded || decoded.type !== 'reset') {
                return reject(new BadRequestException('Invalid or expired reset token'));
            }
            resolve(decoded);
        });
    });
};
