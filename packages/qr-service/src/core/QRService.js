const { v4: uuidv4 } = require('uuid');
const QRTokenService = require('./QRTokenService');
const { QRValidationException, QRNotFoundException, QRConflictException } = require('./QRException');

const ALLOWED_BATCH_COUNTS = [10, 25, 50, 100, 200, 500, 1000];
const VALID_QR_STATUSES = ['unassigned', 'active', 'disabled', 'revoked'];
const VALID_BATCH_STATUSES = ['generated', 'printed', 'active', 'archived'];

/**
 * Core QR Service - Framework and database agnostic
 * Manages QR code lifecycle and business logic
 */
class QRService {
    constructor(dbAdapter, options = {}) {
        if (!dbAdapter) {
            throw new Error('Database adapter is required');
        }

        this.dbAdapter = dbAdapter;
        this.tokenService = new QRTokenService();
        this.config = {
            maxHumanTokenAttempts: 10,
            ...options,
        };
    }

    /**
     * Validate that a batch count is allowed
     * @private
     */
    _validateBatchCount(count) {
        if (!ALLOWED_BATCH_COUNTS.includes(count)) {
            throw new QRValidationException(`Count must be one of: ${ALLOWED_BATCH_COUNTS.join(', ')}`, {
                allowed: ALLOWED_BATCH_COUNTS,
                provided: count,
            });
        }
    }

    /**
     * Ensure a unique human token by retrying
     * @private
     */
    async _ensureUniqueHumanToken() {
        for (let attempt = 0; attempt < this.config.maxHumanTokenAttempts; attempt++) {
            const humanToken = this.tokenService.generateHumanToken();
            const existing = await this.dbAdapter.findQRCodeByHumanToken(humanToken);
            if (!existing) return humanToken;
        }

        throw new QRConflictException('Failed to generate unique human token after multiple attempts');
    }

    /**
     * Create a single QR code record
     * @private
     */
    async _createQRCodeRecord(batchId = null) {
        const qrCode = await this.dbAdapter.createQRCode({
            id: uuidv4(),
            token: this.tokenService.generateSecureToken(),
            humanToken: await this._ensureUniqueHumanToken(),
            batchId,
            status: 'unassigned',
        });

        return qrCode;
    }

    /**
     * Generate a unique batch number for the day
     * @private
     */
    async _generateBatchNumber(purpose, date) {
        const typeCode = this.tokenService.getBatchTypeCode(purpose);
        const { dayKey, displayDate } = this.tokenService.formatBatchDateParts(date);

        const startOfDay = new Date(`${dayKey}T00:00:00.000Z`);
        const nextDayStart = new Date(startOfDay);
        nextDayStart.setDate(nextDayStart.getDate() + 1);

        const batches = await this.dbAdapter.findBatchesByDateRange(startOfDay, nextDayStart);

        let maxSequence = 0;
        for (const batch of batches) {
            const match = batch.batchNumber.match(/-(\d{3})$/);
            if (!match) continue;

            const sequence = parseInt(match[1], 10);
            if (sequence > maxSequence) maxSequence = sequence;
        }

        return `${typeCode}-${displayDate}-${String(maxSequence + 1).padStart(3, '0')}`;
    }

    /**
     * Create a single QR code
     */
    async createQRCode() {
        const qrCode = await this._createQRCodeRecord();
        return {
            success: true,
            data: qrCode,
            message: 'QR code created successfully',
        };
    }

    /**
     * Create a batch of QR codes
     */
    async createQRCodeBatch(payload) {
        const { count, purpose = 'digital', createdBy, notes, printJobRef } = payload;

        this._validateBatchCount(count);

        const batch = await this.dbAdapter.createBatch({
            id: uuidv4(),
            batchNumber: await this._generateBatchNumber(purpose, new Date()),
            purpose,
            status: this.tokenService.getInitialBatchStatus(purpose),
            quantity: count,
            createdBy: createdBy || null,
            notes: notes?.trim() || null,
            printJobRef: printJobRef?.trim() || null,
        });

        const qrCodes = [];
        for (let i = 0; i < count; i++) {
            qrCodes.push(await this._createQRCodeRecord(batch.id));
        }

        return {
            success: true,
            data: { batch, qrCodes },
            message: `QR batch created successfully with ${count} codes`,
        };
    }

    /**
     * Claim a QR code by user
     */
    async claimQRCode(userId, token, humanToken) {
        if (!token && !humanToken) {
            throw new QRValidationException('Either token or humanToken must be provided');
        }

        let qrCode;
        if (token) {
            qrCode = await this.dbAdapter.findQRCodeByToken(token);
        } else {
            qrCode = await this.dbAdapter.findQRCodeByHumanToken(humanToken);
        }

        if (!qrCode) {
            throw new QRNotFoundException('QR code not found');
        }

        if (qrCode.status !== 'unassigned') {
            throw new QRConflictException(`Cannot claim QR code with status: ${qrCode.status}`);
        }

        const updated = await this.dbAdapter.updateQRCode(qrCode.id, {
            assignedUserId: userId,
            status: 'active',
            assignedAt: new Date(),
        });

        return {
            success: true,
            data: updated,
            message: 'QR code claimed successfully',
        };
    }

    /**
     * Assign a QR code to a user (admin operation)
     */
    async assignQRCode(qrCodeId, userId) {
        if (!qrCodeId || !userId) {
            throw new QRValidationException('QR code ID and user ID are required');
        }

        const qrCode = await this.dbAdapter.findQRCodeById(qrCodeId);
        if (!qrCode) {
            throw new QRNotFoundException('QR code not found');
        }

        const updated = await this.dbAdapter.updateQRCode(qrCodeId, {
            assignedUserId: userId,
            status: 'active',
            assignedAt: new Date(),
        });

        return {
            success: true,
            data: updated,
            message: 'QR code assigned successfully',
        };
    }

    /**
     * Scan/resolve a QR code
     */
    async scanQRCode(token, humanToken) {
        if (!token && !humanToken) {
            throw new QRValidationException('Either token or humanToken must be provided');
        }

        let qrCode;
        if (token) {
            qrCode = await this.dbAdapter.findQRCodeByToken(token);
        } else {
            qrCode = await this.dbAdapter.findQRCodeByHumanToken(humanToken);
        }

        if (!qrCode) {
            throw new QRNotFoundException('QR code not found');
        }

        // Update last scanned timestamp
        await this.dbAdapter.updateQRCode(qrCode.id, {
            lastScannedAt: new Date(),
        });

        return {
            success: true,
            data: qrCode,
            message: 'QR code scanned successfully',
        };
    }

    /**
     * Get all QR codes assigned to a user
     */
    async getUserQRCodes(userId) {
        if (!userId) {
            throw new QRValidationException('User ID is required');
        }

        const qrCodes = await this.dbAdapter.findQRCodesByUserId(userId);

        return {
            success: true,
            data: qrCodes,
            message: 'User QR codes retrieved successfully',
        };
    }

    /**
     * Get unassigned QR codes with pagination
     */
    async getUnassignedQRCodes(limit = 50, cursor = null) {
        const result = await this.dbAdapter.findUnassignedQRCodes(limit + 1, cursor);

        const hasMore = result.length > limit;
        const qrCodes = result.slice(0, limit);

        let nextCursor = null;
        if (hasMore && qrCodes.length > 0) {
            const lastQR = qrCodes[qrCodes.length - 1];
            nextCursor = Buffer.from(`${lastQR.createdAt.toISOString()}:${lastQR.id}`).toString('base64');
        }

        return {
            success: true,
            data: {
                qrCodes,
                hasMore,
                cursor: nextCursor,
            },
            message: 'Unassigned QR codes retrieved successfully',
        };
    }

    /**
     * Revoke a QR code (make it inactive)
     */
    async revokeQRCode(qrCodeId, requestedBy) {
        if (!qrCodeId) {
            throw new QRValidationException('QR code ID is required');
        }

        const qrCode = await this.dbAdapter.findQRCodeById(qrCodeId);
        if (!qrCode) {
            throw new QRNotFoundException('QR code not found');
        }

        const updated = await this.dbAdapter.updateQRCode(qrCodeId, {
            status: 'revoked',
            revokedAt: new Date(),
            revokedBy: requestedBy,
        });

        return {
            success: true,
            data: updated,
            message: 'QR code revoked successfully',
        };
    }

    /**
     * Disable a QR code temporarily
     */
    async disableQRCode(qrCodeId, requestedBy) {
        if (!qrCodeId) {
            throw new QRValidationException('QR code ID is required');
        }

        const qrCode = await this.dbAdapter.findQRCodeById(qrCodeId);
        if (!qrCode) {
            throw new QRNotFoundException('QR code not found');
        }

        const updated = await this.dbAdapter.updateQRCode(qrCodeId, {
            status: 'disabled',
            disabledAt: new Date(),
            disabledBy: requestedBy,
        });

        return {
            success: true,
            data: updated,
            message: 'QR code disabled successfully',
        };
    }

    /**
     * Reactivate a disabled QR code
     */
    async reactivateQRCode(qrCodeId, requestedBy) {
        if (!qrCodeId) {
            throw new QRValidationException('QR code ID is required');
        }

        const qrCode = await this.dbAdapter.findQRCodeById(qrCodeId);
        if (!qrCode) {
            throw new QRNotFoundException('QR code not found');
        }

        if (qrCode.status !== 'disabled') {
            throw new QRConflictException(`Can only reactivate disabled codes, current status: ${qrCode.status}`);
        }

        const updated = await this.dbAdapter.updateQRCode(qrCodeId, {
            status: 'active',
            disabledAt: null,
            disabledBy: null,
        });

        return {
            success: true,
            data: updated,
            message: 'QR code reactivated successfully',
        };
    }

    /**
     * Get a single QR code by ID
     */
    async getQRCodeById(qrCodeId) {
        if (!qrCodeId) {
            throw new QRValidationException('QR code ID is required');
        }

        const qrCode = await this.dbAdapter.findQRCodeById(qrCodeId);
        if (!qrCode) {
            throw new QRNotFoundException('QR code not found');
        }

        return {
            success: true,
            data: qrCode,
            message: 'QR code retrieved successfully',
        };
    }

    /**
     * Get a batch by ID
     */
    async getBatchById(batchId) {
        if (!batchId) {
            throw new QRValidationException('Batch ID is required');
        }

        const batch = await this.dbAdapter.findBatchById(batchId);
        if (!batch) {
            throw new QRNotFoundException('Batch not found');
        }

        return {
            success: true,
            data: batch,
            message: 'Batch retrieved successfully',
        };
    }
}

module.exports = QRService;
