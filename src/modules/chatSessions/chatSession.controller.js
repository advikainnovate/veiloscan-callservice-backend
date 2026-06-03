const { errorResponse, successResponse } = require('../../helpers');
const chatSessionService = require('./chatSession.service');

const sendServiceResponse = (res, response) => {
    if (!response.success) {
        return errorResponse(res, response.code, response.message, response.data);
    }
    return successResponse(res, response.code, response.message, response.data);
};

const normalizeLimit = (raw, fallback = 50, max = 100) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.min(max, Math.trunc(parsed)));
};

exports.initiateChat = async (req, res, next) => {
    try {
        const response = await chatSessionService.initiateChat(req.user.id, req.body.qrToken);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getChatSession = async (req, res, next) => {
    try {
        const response = await chatSessionService.getChatSessionForUser(req.params.chatSessionId, req.user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getMyChatSessions = async (req, res, next) => {
    try {
        const response = await chatSessionService.getUserChatSessions(req.user.id, normalizeLimit(req.query.limit));
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getActiveChatSessions = async (req, res, next) => {
    try {
        const response = await chatSessionService.getActiveChatSessions(req.user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.endChatSession = async (req, res, next) => {
    try {
        const response = await chatSessionService.endChatSession(req.params.chatSessionId, req.user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.blockChatSession = async (req, res, next) => {
    try {
        const response = await chatSessionService.blockChatSession(req.params.chatSessionId, req.user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};
