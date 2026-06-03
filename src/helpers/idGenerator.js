const { ID_CONFIG } = require('../config/idPrefixes');

/**
 * Pads a number with leading zeros to the specified length
 * @param {number} number - The number to pad
 * @param {number} length - The desired length
 * @returns {string} - Padded number as string
 */
const padNumber = (number, length) => {
    return String(number).padStart(length, '0');
};

/**
 * Extracts the numeric part from an ID by removing the prefix
 * @param {string} id - The full ID (e.g., "GTCC000005")
 * @param {string} prefix - The prefix to remove (e.g., "GTCC")
 * @returns {number} - The numeric part as a number
 */
const extractNumericPart = (id, prefix) => {
    if (!id) return 0;
    const numericPart = id.replace(prefix, '');
    return parseInt(numericPart, 10) || 0;
};

/**
 * Generates the next ID based on the last ID
 * @param {string|null} lastId - The last ID in the system (e.g., "GTCC000005" or null)
 * @param {string} prefix - The prefix for the ID (e.g., "GTCC")
 * @param {number} paddingLength - The length of the numeric part (default: 6)
 * @returns {string} - The next ID (e.g., "GTCC000006")
 */
const generateNextId = (lastId, prefix, paddingLength = ID_CONFIG.PADDING_LENGTH) => {
    let nextNumber = ID_CONFIG.START_NUMBER;

    if (lastId) {
        const currentNumber = extractNumericPart(lastId, prefix);
        nextNumber = currentNumber + 1;
    }

    const paddedNumber = padNumber(nextNumber, paddingLength);
    return `${prefix}${paddedNumber}`;
};

/**
 * Generates a URL-friendly slug from a given text
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The generated slug (e.g., "hello_world")
 */
const generateSlugCode = (text) => {
    if (!text) return '';

    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^\w_]+/g, '') // Remove all non-word chars except underscores
        .replace(/__+/g, '_') // Replace multiple underscores with single underscore
        .replace(/^_+/, '') // Trim underscores from start
        .replace(/_+$/, ''); // Trim underscores from end
};

module.exports = {
    generateNextId,
    generateSlugCode,
    extractNumericPart,
    padNumber,
};
