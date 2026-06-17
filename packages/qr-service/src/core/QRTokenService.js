const crypto = require('crypto');

const HUMAN_TOKEN_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const SECURE_TOKEN_LENGTH = 32; // 64 hex chars when stringified

/**
 * Handles all QR token generation and formatting
 * Pure utility service with no external dependencies
 */
class QRTokenService {
    /**
     * Generate a cryptographically secure token
     * @returns {string} 64-character hex string
     */
    generateSecureToken() {
        return crypto.randomBytes(SECURE_TOKEN_LENGTH).toString('hex');
    }

    /**
     * Generate a single 4-character part of human token
     * @private
     * @returns {string} 4-character alphanumeric string
     */
    _generateHumanTokenPart() {
        let tokenPart = '';
        for (let i = 0; i < 4; i++) {
            tokenPart += HUMAN_TOKEN_CHARS.charAt(Math.floor(Math.random() * HUMAN_TOKEN_CHARS.length));
        }
        return tokenPart;
    }

    /**
     * Generate a human-readable token (e.g., QR-ABCD-EFGH)
     * @returns {string} Human-readable token
     */
    generateHumanToken() {
        return `QR-${this._generateHumanTokenPart()}-${this._generateHumanTokenPart()}`;
    }

    /**
     * Get initial batch status based on purpose
     * @param {string} purpose - 'printing' or 'digital'
     * @returns {string} Initial status ('generated' or 'active')
     */
    getInitialBatchStatus(purpose = 'digital') {
        return 'generated';
    }

    /**
     * Get batch type code based on purpose
     * @param {string} purpose - 'printing' or 'digital'
     * @returns {string} Two-letter type code (PR or DG)
     */
    getBatchTypeCode(purpose) {
        return purpose === 'printing' ? 'PR' : 'DG';
    }

    /**
     * Format date into batch number parts
     * @param {Date} date
     * @returns {Object} { dayKey, displayDate }
     */
    formatBatchDateParts(date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);

        return {
            dayKey: `${date.getFullYear()}-${month}-${day}`,
            displayDate: `${day}${month}${year}`,
        };
    }

    /**
     * Extract QR code token from various input formats
     * Supports: full URL, resolve URL, raw token
     * @param {string} input - Token input in various formats
     * @returns {string|null} Extracted token or null
     */
    extractQRCodeToken(input) {
        if (!input || typeof input !== 'string') return null;

        const trimmed = input.trim();

        // Try to extract from resolve URL
        const resolveMatch = trimmed.match(/\/qr(?:-code)?s?\/resolve\/([a-f0-9]{64})/i);
        if (resolveMatch) return resolveMatch[1];

        // Try to extract raw token
        const tokenMatch = trimmed.match(/[a-f0-9]{64}/i);
        return tokenMatch ? tokenMatch[0] : null;
    }

    /**
     * Build a resolve URL for a QR token
     * @param {string} backendUrl - Base backend URL
     * @param {string} token - QR code token
     * @returns {string} Full resolve URL
     */
    buildResolveUrl(backendUrl, token) {
        return `${backendUrl}/api/qr/resolve/${token}`;
    }

    /**
     * Validate token format
     * @param {string} token - Token to validate
     * @param {string} type - 'secure' or 'human'
     * @returns {boolean}
     */
    isValidToken(token, type = 'secure') {
        if (!token || typeof token !== 'string') return false;

        if (type === 'secure') {
            return /^[a-f0-9]{64}$/i.test(token);
        }

        if (type === 'human') {
            return /^QR-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(token);
        }

        return false;
    }
}

module.exports = QRTokenService;
