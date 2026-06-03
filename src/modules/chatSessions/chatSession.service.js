const { v4: uuidv4 } = require('uuid');
const { HTTP_CODES, MESSAGES } = require('../../config');
const { BadRequestException, ForbiddenException, NotFoundException, serviceResponse } = require('../../helpers');
const { logger } = require('../../utils');
const db = require('../../database/models');
const qrCodeService = require('../qrCodes/qrCode.service');
const chatSessionRepository = require('./chatSession.repository');

const chatSessionTtlMs = 24 * 60 * 60 * 1000;
const activeChatLimit = 50;

const getExpirationCutoff = () => new Date(Date.now() - chatSessionTtlMs);

const isExpired = (chatSession) => chatSession.status === 'active' && chatSession.startedAt && chatSession.startedAt <= getExpirationCutoff();

const addParticipantNames = (chatSession) => {
    if (!chatSession) return chatSession;

    const plain = typeof chatSession.get === 'function' ? chatSession.get({ plain: true }) : chatSession;
    return {
        ...plain,
        participant1Name: plain.participant1?.username || plain.participant1?.display_name || null,
        participant2Name: plain.participant2?.username || plain.participant2?.display_name || null,
    };
};

const assertActiveUser = async (userId, message) => {
    const user = await db.UserModel.findOne({ where: { id: userId, deletedAt: null } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status !== 'active') throw new BadRequestException(message);
    return user;
};

const expireChatSessionIfNeeded = async (chatSession) => {
    if (!isExpired(chatSession)) {
        return chatSession;
    }

    return chatSessionRepository.update(chatSession.id, {
        status: 'ended',
        endedAt: new Date(),
    });
};

const getChatSessionByIdRaw = async (chatSessionId) => {
    const chatSession = await chatSessionRepository.findById(chatSessionId);
    if (!chatSession) throw new NotFoundException('Chat session not found');

    const refreshedChat = await expireChatSessionIfNeeded(chatSession);
    return addParticipantNames(refreshedChat);
};

const checkActiveChatLimit = async (userId) => {
    const activeCount = await chatSessionRepository.countActiveByUser(userId);
    if (activeCount >= activeChatLimit) {
        throw new BadRequestException(`Active chat limit reached (${activeCount}/${activeChatLimit})`);
    }
};

const initiateChatSession = async (initiatorId, qrToken) => {
    const qrCode = await qrCodeService.validateQRCode(qrToken);

    if (!qrCode.assignedUserId) {
        throw new BadRequestException('QR code is not assigned to any user');
    }

    await assertActiveUser(qrCode.assignedUserId, 'Receiver is not active');

    if (initiatorId === qrCode.assignedUserId) {
        throw new BadRequestException('Cannot chat with yourself');
    }

    const existingChat = await chatSessionRepository.findByParticipants(initiatorId, qrCode.assignedUserId);
    if (existingChat && existingChat.status === 'active') {
        const refreshedChat = await expireChatSessionIfNeeded(existingChat);
        if (refreshedChat.status === 'active') {
            logger.info(`Returning existing chat session: ${existingChat.id}`);
            return getChatSessionByIdRaw(existingChat.id);
        }
    }

    await checkActiveChatLimit(initiatorId);

    const chatSession = await chatSessionRepository.create({
        id: uuidv4(),
        participant1Id: initiatorId,
        participant2Id: qrCode.assignedUserId,
        qrId: qrCode.id,
        status: 'active',
        startedAt: new Date(),
    });

    logger.info(`Chat session initiated: ${chatSession.id} between ${initiatorId} and ${qrCode.assignedUserId}`);
    return getChatSessionByIdRaw(chatSession.id);
};

const initiateChat = async (initiatorId, qrToken) => {
    const chatSession = await initiateChatSession(initiatorId, qrToken);
    return serviceResponse(true, HTTP_CODES.CREATED, 'Chat session initiated successfully', chatSession);
};

const getChatSessionForUserRaw = async (chatSessionId, userId) => {
    const chatSession = await getChatSessionByIdRaw(chatSessionId);

    if (chatSession.participant1Id !== userId && chatSession.participant2Id !== userId) {
        throw new NotFoundException('Chat session not found');
    }

    return chatSession;
};

const getChatSessionForUser = async (chatSessionId, userId) => {
    const chatSession = await getChatSessionForUserRaw(chatSessionId, userId);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, chatSession);
};

const getUserChatSessionsRaw = async (userId, limit = 50) => {
    const chatSessions = await chatSessionRepository.findUserChatSessions(userId, limit);
    return chatSessions.map(addParticipantNames);
};

const getUserChatSessions = async (userId, limit = 50) => {
    const chats = await getUserChatSessionsRaw(userId, limit);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, { chats });
};

const getActiveChatSessionsRaw = async (userId) => {
    const chatSessions = await chatSessionRepository.findUserChatSessions(userId, 100, true);
    return chatSessions.map(addParticipantNames);
};

const getActiveChatSessions = async (userId) => {
    const chats = await getActiveChatSessionsRaw(userId);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, { chats });
};

const assertParticipant = async (chatSessionId, userId, action) => {
    const chatSession = await getChatSessionByIdRaw(chatSessionId);
    if (chatSession.participant1Id !== userId && chatSession.participant2Id !== userId) {
        throw new ForbiddenException(`You do not have permission to ${action} this chat`);
    }
    return chatSession;
};

const endChatSessionRaw = async (chatSessionId, userId) => {
    await assertParticipant(chatSessionId, userId, 'end');
    const updatedChat = await chatSessionRepository.update(chatSessionId, {
        status: 'ended',
        endedAt: new Date(),
    });

    logger.info(`Chat session ended: ${chatSessionId} by user ${userId}`);
    return addParticipantNames(updatedChat);
};

const endChatSession = async (chatSessionId, userId) => {
    const chatSession = await endChatSessionRaw(chatSessionId, userId);
    return serviceResponse(true, HTTP_CODES.OK, 'Chat session ended successfully', chatSession);
};

const blockChatSessionRaw = async (chatSessionId, userId) => {
    await assertParticipant(chatSessionId, userId, 'block');
    const updatedChat = await chatSessionRepository.update(chatSessionId, {
        status: 'blocked',
        endedAt: new Date(),
    });

    logger.info(`Chat session blocked: ${chatSessionId} by user ${userId}`);
    return addParticipantNames(updatedChat);
};

const blockChatSession = async (chatSessionId, userId) => {
    const chatSession = await blockChatSessionRaw(chatSessionId, userId);
    return serviceResponse(true, HTTP_CODES.OK, 'Chat session blocked successfully', chatSession);
};

const closeExpiredChatSessionsRaw = async () => {
    const [expiredCount] = await chatSessionRepository.closeExpired(getExpirationCutoff());
    if (expiredCount > 0) {
        logger.info(`Closed ${expiredCount} expired chat session(s) older than 24 hours`);
    }
    return expiredCount;
};

const closeExpiredChatSessions = async () => {
    const expiredCount = await closeExpiredChatSessionsRaw();
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.UPDATED, { count: expiredCount });
};

const updateLastMessageTime = async (chatSessionId) => {
    await chatSessionRepository.update(chatSessionId, { lastMessageAt: new Date() });
};

const getActiveChatCount = async (userId) => chatSessionRepository.countActiveByUser(userId);

const verifyParticipant = async (chatSessionId, userId) => {
    if (!chatSessionId || typeof chatSessionId !== 'string') {
        throw new BadRequestException('Invalid chat session ID format');
    }

    try {
        await getChatSessionForUserRaw(chatSessionId, userId);
        return true;
    } catch (error) {
        if (error instanceof NotFoundException) return false;
        throw error;
    }
};

const getOtherParticipantId = async (chatSessionId, userId) => {
    const chatSession = await getChatSessionByIdRaw(chatSessionId);

    if (chatSession.participant1Id === userId) return chatSession.participant2Id;
    if (chatSession.participant2Id === userId) return chatSession.participant1Id;

    throw new ForbiddenException('You are not a participant in this chat');
};

module.exports = {
    initiateChat,
    initiateChatSession,
    getChatSessionById: getChatSessionByIdRaw,
    getChatSessionForUser,
    getChatSessionForUserRaw,
    getUserChatSessions,
    getUserChatSessionsRaw,
    getActiveChatSessions,
    getActiveChatSessionsRaw,
    endChatSession,
    endChatSessionRaw,
    blockChatSession,
    blockChatSessionRaw,
    closeExpiredChatSessions,
    closeExpiredChatSessionsRaw,
    updateLastMessageTime,
    getActiveChatCount,
    verifyParticipant,
    getOtherParticipantId,
};
