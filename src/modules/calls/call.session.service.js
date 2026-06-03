const { v4: uuidv4 } = require('uuid');
const { HTTP_CODES, MESSAGES } = require('../../config');
const { BadRequestException, NotFoundException, serviceResponse } = require('../../helpers');
const { logger } = require('../../utils');
const callRepository = require('./call.repository');
const callStateService = require('./call.state.service');
const qrCodeService = require('../qrCodes/qrCode.service');
const chatSessionService = require('../chatSessions/chatSession.service');

const transitionCall = async (call, actor, nextStatus, endedReason) => {
    callStateService.canTransition(call, actor, nextStatus, endedReason);
    const updateData = callStateService.buildTransitionUpdate(call, nextStatus, endedReason);
    const updatedCall = await callRepository.update(call.id, updateData);

    logger.info(`Call session ${call.id} updated to status: ${nextStatus}`);
    return updatedCall;
};

const initiateCallSession = async (payload) => {
    let { receiverId, qrId } = payload;
    const { callerId, qrToken, guestId, guestIp } = payload;

    if (!callerId && !guestId) {
        throw new BadRequestException('Either callerId or guestId must be provided');
    }

    if (qrToken) {
        const qrCode = await qrCodeService.validateQRCode(qrToken);
        receiverId = qrCode.assignedUserId;
        qrId = qrCode.id;
    }

    if (!receiverId || !qrId) {
        throw new BadRequestException('Either qrToken or both receiverId and qrId must be provided');
    }

    if (callerId && callerId === receiverId) {
        throw new BadRequestException('Cannot call yourself');
    }

    const existingCall = await callRepository.findExistingActiveCall({
        callerId: callerId || null,
        guestId: guestId || null,
        receiverId,
        qrId,
    });

    if (existingCall) {
        logger.info(`Reusing existing active call ${existingCall.id}`);
        return { callSession: existingCall, isExisting: true };
    }

    const callSession = await callRepository.create({
        id: uuidv4(),
        callerId: callerId || null,
        guestId: guestId || null,
        guestIp: guestIp || null,
        callerType: callerId ? 'registered' : 'anonymous',
        receiverId,
        qrId,
        status: 'initiated',
    });

    logger.info(`Call session initiated: ${callSession.id}`);
    return { callSession, isExisting: false };
};

const initiateCall = async (payload) => {
    const { callSession, isExisting } = await initiateCallSession(payload);
    return serviceResponse(true, isExisting ? HTTP_CODES.OK : HTTP_CODES.CREATED, isExisting ? MESSAGES.SUCCESS.OK : MESSAGES.SUCCESS.CREATED, callSession);
};

const updateCallStatusRaw = async (callId, userId, status, endedReason) => {
    const actor = callStateService.parseActor(userId);
    const existingCall = await getCallSessionById(callId);
    callStateService.assertActorCanView(existingCall, actor, callId);

    return transitionCall(existingCall, actor, status, endedReason);
};

const updateCallStatus = async (callId, userId, status, endedReason) => {
    const updatedCall = await updateCallStatusRaw(callId, userId, status, endedReason);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.UPDATED, updatedCall);
};

const initiateCallFromChatRaw = async (callerId, chatSessionId) => {
    const chatSession = await chatSessionService.getChatSessionById(chatSessionId);

    if (chatSession.status !== 'active') {
        throw new BadRequestException(`Cannot start a call from a ${chatSession.status} chat`);
    }

    if (chatSession.participant1Id !== callerId && chatSession.participant2Id !== callerId) {
        throw new BadRequestException('You are not a participant in this chat');
    }

    if (!chatSession.qrId) {
        throw new BadRequestException('Chat session is missing its source QR');
    }

    const receiverId = chatSession.participant1Id === callerId ? chatSession.participant2Id : chatSession.participant1Id;

    const { callSession } = await initiateCallSession({
        callerId,
        receiverId,
        qrId: chatSession.qrId,
    });
    return callSession;
};

const initiateCallFromChat = async (callerId, chatSessionId) => {
    const callSession = await initiateCallFromChatRaw(callerId, chatSessionId);
    return serviceResponse(true, HTTP_CODES.CREATED, MESSAGES.SUCCESS.CREATED, callSession);
};

const getCallSessionById = async (callId) => {
    const callSession = await callRepository.findById(callId);
    if (!callSession) {
        throw new NotFoundException('Call session not found');
    }

    return callSession;
};

const getCallSessionForActorRaw = async (callId, userId) => {
    const actor = callStateService.parseActor(userId);
    const call = await getCallSessionById(callId);
    callStateService.assertActorCanView(call, actor, callId);
    return call;
};

const getCallSessionForActor = async (callId, userId) => {
    const call = await getCallSessionForActorRaw(callId, userId);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, call);
};

const getUserCallHistoryRaw = async (userId, limit = 50) => {
    const actor = callStateService.parseActor(userId);
    return callRepository.getHistory({
        userId: actor.kind === 'user' ? actor.id : null,
        guestId: actor.kind === 'guest' ? actor.id : null,
        limit,
    });
};

const getUserCallHistory = async (userId, limit = 50) => {
    const calls = await getUserCallHistoryRaw(userId, limit);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, calls);
};

const getActiveCallsRaw = async (userId) => {
    const actor = callStateService.parseActor(userId);
    return callRepository.getActiveCalls({
        userId: actor.kind === 'user' ? actor.id : null,
        guestId: actor.kind === 'guest' ? actor.id : null,
    });
};

const getActiveCalls = async (userId) => {
    const calls = await getActiveCallsRaw(userId);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, calls);
};

const endCall = async (callId, userId, reason) => {
    return updateCallStatus(callId, userId, 'ended', reason);
};

const rejectCall = async (callId, userId) => {
    return updateCallStatus(callId, userId, 'failed', 'rejected');
};

const acceptCall = async (callId, userId) => {
    return updateCallStatus(callId, userId, 'connected');
};

const ringCall = async (callId, userId) => {
    return updateCallStatus(callId, userId, 'ringing');
};

const connectCall = async (callId, userId) => {
    return updateCallStatus(callId, userId, 'connected');
};

const endActiveCallsForUser = async (userId, reason = 'error') => {
    const systemActor = callStateService.parseActor('system');
    const activeCalls = await getActiveCallsRaw(userId);
    const ended = [];

    for (const call of activeCalls) {
        try {
            const updated = await transitionCall(call, systemActor, 'ended', reason);
            ended.push(updated);
        } catch (err) {
            logger.error(`Failed to end call ${call.id} on disconnect:`, err);
        }
    }

    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.UPDATED, ended);
};

const getCallDuration = async (callId) => {
    const callSession = await getCallSessionById(callId);

    if (!callSession.startedAt || !callSession.endedAt) {
        return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, { duration: 0 });
    }

    const duration = Math.floor((callSession.endedAt.getTime() - callSession.startedAt.getTime()) / 1000);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, { duration });
};

const getDailyCallCount = async (userId) => {
    const count = await callRepository.getDailyCallCount(userId);
    return serviceResponse(true, HTTP_CODES.OK, MESSAGES.SUCCESS.OK, { count });
};

module.exports = {
    initiateCall,
    initiateCallSession,
    initiateCallFromChat,
    initiateCallFromChatRaw,
    updateCallStatus,
    updateCallStatusRaw,
    getCallSessionById,
    getCallSessionForActor,
    getCallSessionForActorRaw,
    getUserCallHistory,
    getUserCallHistoryRaw,
    getActiveCalls,
    getActiveCallsRaw,
    endCall,
    rejectCall,
    acceptCall,
    ringCall,
    connectCall,
    endActiveCallsForUser,
    getCallDuration,
    getDailyCallCount,
};
