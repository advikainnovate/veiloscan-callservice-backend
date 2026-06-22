/**
 * Database Adapter Interface
 * Implement this to support different databases
 */
class IQRDatabaseAdapter {
    /**
     * Create a new QR code record
     * @param {Object} payload - { id, token, humanToken, batchId, status }
     * @returns {Promise<Object>}
     */
    async createQRCode(payload) {
        throw new Error('createQRCode not implemented');
    }

    /**
     * Create a new batch record
     * @param {Object} payload
     * @returns {Promise<Object>}
     */
    async createBatch(payload) {
        throw new Error('createBatch not implemented');
    }

    /**
     * Find QR code by ID
     */
    async findQRCodeById(id) {
        throw new Error('findQRCodeById not implemented');
    }

    /**
     * Find QR code by secure token
     */
    async findQRCodeByToken(token) {
        throw new Error('findQRCodeByToken not implemented');
    }

    /**
     * Find QR code by human-readable token
     */
    async findQRCodeByHumanToken(humanToken) {
        throw new Error('findQRCodeByHumanToken not implemented');
    }

    /**
     * Find all QR codes assigned to a user
     */
    async findQRCodesByUserId(userId) {
        throw new Error('findQRCodesByUserId not implemented');
    }

    /**
     * Find unassigned QR codes with pagination
     */
    async findUnassignedQRCodes(limit, cursor) {
        throw new Error('findUnassignedQRCodes not implemented');
    }

    /**
     * Find batches in a date range
     */
    async findBatchesByDateRange(startDate, endDate) {
        throw new Error('findBatchesByDateRange not implemented');
    }

    /**
     * Find batch by ID
     */
    async findBatchById(id) {
        throw new Error('findBatchById not implemented');
    }

    /**
     * Update QR code
     */
    async updateQRCode(qrCodeId, updates) {
        throw new Error('updateQRCode not implemented');
    }

    /**
     * Update batch
     */
    async updateBatch(batchId, updates) {
        throw new Error('updateBatch not implemented');
    }
}

module.exports = IQRDatabaseAdapter;
