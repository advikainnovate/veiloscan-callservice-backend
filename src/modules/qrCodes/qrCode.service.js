const { v4: uuidv4 } = require('uuid');
const { CONFIG, HTTP_CODES, MESSAGES } = require('../../config');
const { BadRequestException, NotFoundException, serviceResponse } = require('../../helpers');
const { logger } = require('../../utils');
const db = require('../../database/models');
const qrCodeRepository = require('./qrCode.repository');
const qrTokenService = require('./qrToken.service');

const allowedBatchCounts = [10, 25, 50, 100, 200, 500, 1000];

const getUserById = async (userId) => {
    const user = await db.UserModel.findOne({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    return user;
};

const assertActiveUser = async (userId, message) => {
    const user = await getUserById(userId);
    if (user.status !== 'active') {
        throw new BadRequestException(message);
    }
    return user;
};

const generateBatchNumber = async (purpose, date) => {
    const typeCode = qrTokenService.getBatchTypeCode(purpose);
    const { dayKey, displayDate } = qrTokenService.formatBatchDateParts(date);
    const startOfDay = new Date(`${dayKey}T00:00:00.000`);
    const nextDayStart = new Date(startOfDay);
    nextDayStart.setDate(nextDayStart.getDate() + 1);

    const rows = await qrCodeRepository.findBatchesForDay(startOfDay, nextDayStart);
    let maxSequence = 0;

    for (const row of rows) {
        const match = row.batchNumber.match(/-(\d{3})$/);
        if (!match) continue;

        const sequence = parseInt(match[1], 10);
        if (sequence > maxSequence) maxSequence = sequence;
    }

    return `${typeCode}-${displayDate}-${String(maxSequence + 1).padStart(3, '0')}`;
};

const ensureUniqueHumanToken = async () => {
    for (let attempt = 0; attempt < 10; attempt++) {
        const humanToken = qrTokenService.generateHumanToken();
        const existing = await qrCodeRepository.findByHumanToken(humanToken);
        if (!existing) return humanToken;
    }

    throw new BadRequestException('Failed to generate unique human token');
};

const createQRCodeRecord = async (batchId = null) => {
    const qrCode = await qrCodeRepository.createQRCode({
        id: uuidv4(),
        token: qrTokenService.generateSecureToken(),
        humanToken: await ensureUniqueHumanToken(),
        batchId,
        status: 'unassigned',
    });

    logger.info(`QR code created: ${qrCode.id} (${qrCode.humanToken})`);
    return qrCode;
};

const createQRCode = async () => {
    const qrCode = await createQRCodeRecord();
    return serviceResponse(true, HTTP_CODES.CREATED, 'QR code created successfully', qrCode);
};

const createQRCodeBatch = async ({ count, purpose, createdBy, notes, printJobRef }) => {
    if (!allowedBatchCounts.includes(count)) {
        throw new BadRequestException(`Count must be one of: ${allowedBatchCounts.join(', ')}`);
    }

    const batch = await qrCodeRepository.createBatch({
        id: uuidv4(),
        batchNumber: await generateBatchNumber(purpose, new Date()),
        purpose,
        status: qrTokenService.getInitialBatchStatus(purpose),
        quantity: count,
        createdBy: createdBy || null,
        notes: notes?.trim() || null,
        printJobRef: printJobRef?.trim() || null,
    });

    const qrCodes = [];
    for (let index = 0; index < count; index++) {
        qrCodes.push(await createQRCodeRecord(batch.id));
    }

    logger.info(`Created QR batch ${batch.batchNumber} with ${count} codes`);
    return serviceResponse(true, HTTP_CODES.CREATED, 'QR batch created successfully', { batch, qrCodes });
};

const refreshDigitalBatchStatus = async (batchId) => {
    if (!batchId) return;

    const batch = await qrCodeRepository.findBatchById(batchId);
    if (!batch || batch.purpose !== 'digital') return;

    const summary = await qrCodeRepository.getBatchSummary(batchId);
    const total = Number(summary?.total || 0);
    const assigned = Number(summary?.assigned || 0);

    let nextStatus = 'generated';
    if (assigned === 0 && total > 0) nextStatus = 'available';
    if (assigned > 0 && assigned < total) nextStatus = 'partially_assigned';
    if (total > 0 && assigned === total) nextStatus = 'fully_assigned';

    if (nextStatus !== batch.status) {
        await batch.update({ status: nextStatus });
    }
};

const getQRCodeByToken = async (input) => {
    const token = qrTokenService.extractQRCodeToken(input);
    if (!token) throw new BadRequestException('Invalid QR token format');

    const qrCode = await qrCodeRepository.findByToken(token);
    if (!qrCode) throw new NotFoundException('QR code not found');

    return qrCode;
};

const getQRCodeByHumanToken = async (humanToken) => {
    const qrCode = await qrCodeRepository.findByHumanToken(humanToken.toUpperCase().trim());
    if (!qrCode) throw new NotFoundException('QR code not found');
    return qrCode;
};

const getQRCodeById = async (qrCodeId) => {
    const qrCode = await qrCodeRepository.findById(qrCodeId);
    if (!qrCode) throw new NotFoundException('QR code not found');
    return qrCode;
};

const claimQRCodeRaw = async (userId, token, humanToken) => {
    if (!token && !humanToken) throw new BadRequestException('Either token or humanToken must be provided');

    await assertActiveUser(userId, 'Cannot claim QR code with inactive account');

    const qrCode = humanToken ? await getQRCodeByHumanToken(humanToken) : await getQRCodeByToken(token);
    if (qrCode.status !== 'unassigned') {
        throw new BadRequestException('QR code is already claimed or not available');
    }

    const existingQRCode = await qrCodeRepository.findActiveOrDisabledByUser(userId);
    if (existingQRCode) {
        throw new BadRequestException('You already have an active or disabled QR code. Please revoke it before claiming a new one.');
    }

    const claimedQRCode = await qrCodeRepository.assignQRCode(qrCode.id, userId);
    await refreshDigitalBatchStatus(claimedQRCode.batchId);

    return claimedQRCode;
};

const claimQRCode = async (userId, token, humanToken) => {
    const claimedQRCode = await claimQRCodeRaw(userId, token, humanToken);
    return serviceResponse(true, HTTP_CODES.OK, 'QR code claimed successfully', claimedQRCode);
};

const assignQRCodeRaw = async (qrCodeId, userId) => {
    await assertActiveUser(userId, 'Cannot assign QR code to inactive user');

    const qrCode = await getQRCodeById(qrCodeId);
    if (qrCode.status !== 'unassigned') {
        throw new BadRequestException('QR code is already assigned or not available');
    }

    const existingQRCode = await qrCodeRepository.findActiveOrDisabledByUser(userId);
    if (existingQRCode) {
        throw new BadRequestException('Target user already has an active or disabled QR code.');
    }

    const assignedQRCode = await qrCodeRepository.assignQRCode(qrCodeId, userId);
    await refreshDigitalBatchStatus(assignedQRCode.batchId);

    return assignedQRCode;
};

const assignQRCode = async (qrCodeId, userId) => {
    const assignedQRCode = await assignQRCodeRaw(qrCodeId, userId);
    return serviceResponse(true, HTTP_CODES.OK, 'QR code assigned successfully', assignedQRCode);
};

const scanQRCodeRaw = async (token, humanToken) => {
    if (!token && !humanToken) throw new BadRequestException('Either token or humanToken must be provided');

    const qrCode = humanToken ? await getQRCodeByHumanToken(humanToken) : await getQRCodeByToken(token);
    if (qrCode.status === 'unassigned') {
        return { qrCode, user: null };
    }

    if (qrCode.status !== 'active') throw new BadRequestException('QR code is not active');
    if (!qrCode.assignedUserId) throw new BadRequestException('QR code is not assigned to any user');

    const user = await assertActiveUser(qrCode.assignedUserId, 'QR code owner is not active');

    return {
        qrCode,
        user: {
            id: user.id,
            username: user.username,
            display_name: user.display_name,
            email: user.email,
            status: user.status,
            createdAt: user.createdAt,
        },
    };
};

const scanQRCode = async (token, humanToken) => {
    const result = await scanQRCodeRaw(token, humanToken);
    return serviceResponse(true, HTTP_CODES.OK, 'QR code scanned successfully', result);
};

const getUserQRCodesRaw = async (userId) => qrCodeRepository.findUserQRCodes(userId);

const getUserQRCodes = async (userId) => {
    const qrCodes = await getUserQRCodesRaw(userId);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, { qrCodes });
};

const getUnassignedQRCodesRaw = async (limit = 50, cursor) => {
    const rows = await qrCodeRepository.getUnassignedQRCodes(limit, cursor);
    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    let nextCursor = null;
    if (hasMore && data.length > 0) {
        const lastItem = data[data.length - 1];
        nextCursor = Buffer.from(`${lastItem.createdAt.toISOString()}:${lastItem.id}`).toString('base64');
    }

    return { data, nextCursor, hasMore };
};

const getUnassignedQRCodes = async (limit = 50, cursor) => {
    const result = await getUnassignedQRCodesRaw(limit, cursor);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, result);
};

const updateQRCodeStatusForUserRaw = async (qrCodeId, userId, status) => {
    const qrCode = await qrCodeRepository.updateQRCode(qrCodeId, { status }, { assignedUserId: userId });
    if (!qrCode || qrCode.assignedUserId !== userId) {
        throw new NotFoundException('QR code not found or you do not have permission to update it');
    }

    return qrCode;
};

const updateQRCodeStatusForUser = async (qrCodeId, userId, status) => {
    const qrCode = await updateQRCodeStatusForUserRaw(qrCodeId, userId, status);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.UPDATED, qrCode);
};

const revokeQRCode = async (qrCodeId, userId) => updateQRCodeStatusForUser(qrCodeId, userId, 'revoked');

const disableQRCode = async (qrCodeId, userId) => updateQRCodeStatusForUser(qrCodeId, userId, 'disabled');

const reactivateQRCode = async (qrCodeId, userId) => updateQRCodeStatusForUser(qrCodeId, userId, 'active');

const validateQRCode = async (input) => {
    const qrCode = await getQRCodeByToken(input);
    if (qrCode.status !== 'active') {
        throw new NotFoundException('Invalid, revoked, or disabled QR code');
    }
    return qrCode;
};

const generateQRCodeImage = async (input) => {
    const token = qrTokenService.extractQRCodeToken(input);
    if (!token) throw new BadRequestException('Invalid QR token format');

    let QRCode;
    try {
        QRCode = require('qrcode');
    } catch (error) {
        throw new BadRequestException('QR image generation requires the qrcode package');
    }

    const qrUrl = qrTokenService.buildResolveUrl(CONFIG.APP.BASE_URL, token);
    return QRCode.toDataURL(qrUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#000000', light: '#FFFFFF' },
    });
};

module.exports = {
    createQRCode,
    createQRCodeBatch,
    claimQRCode,
    claimQRCodeRaw,
    assignQRCode,
    assignQRCodeRaw,
    scanQRCode,
    scanQRCodeRaw,
    getQRCodeByToken,
    getQRCodeByHumanToken,
    getQRCodeById,
    getUserQRCodes,
    getUserQRCodesRaw,
    getUnassignedQRCodes,
    getUnassignedQRCodesRaw,
    revokeQRCode,
    disableQRCode,
    reactivateQRCode,
    updateQRCodeStatusForUserRaw,
    validateQRCode,
    generateQRCodeImage,
};
