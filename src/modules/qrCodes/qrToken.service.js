const crypto = require('crypto');

const humanTokenChars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

const generateHumanTokenPart = () => {
    let tokenPart = '';

    for (let index = 0; index < 4; index++) {
        tokenPart += humanTokenChars.charAt(Math.floor(Math.random() * humanTokenChars.length));
    }

    return tokenPart;
};

exports.generateSecureToken = () => crypto.randomBytes(32).toString('hex');

exports.generateHumanToken = () => `QR-${generateHumanTokenPart()}-${generateHumanTokenPart()}`;

exports.getInitialBatchStatus = () => 'generated';

exports.getBatchTypeCode = (purpose) => (purpose === 'printing' ? 'PR' : 'DG');

exports.formatBatchDateParts = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);

    return {
        dayKey: `${date.getFullYear()}-${month}-${day}`,
        displayDate: `${day}${month}${year}`,
    };
};

exports.buildResolveUrl = (backendUrl, token) => `${backendUrl}/api/v1/qr-codes/resolve/${token}`;

exports.extractQRCodeToken = (input) => {
    if (!input || typeof input !== 'string') return null;

    const trimmed = input.trim();
    const resolveMatch = trimmed.match(/\/qr-codes\/resolve\/([a-f0-9]{64})/i);
    if (resolveMatch) return resolveMatch[1];

    const tokenMatch = trimmed.match(/[a-f0-9]{64}/i);
    return tokenMatch ? tokenMatch[0] : null;
};
