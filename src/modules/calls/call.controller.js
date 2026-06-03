const { errorResponse, successResponse } = require('../../helpers');
const callService = require('./call.session.service');

const sendServiceResponse = (res, response) => {
    if (!response.success) {
        return errorResponse(res, response.code, response.message, response.data);
    }
    return successResponse(res, response.code, response.message, response.data);
};

const getActorId = (req) => req.user?.id || req.body.userId || req.query.userId;

exports.initiateCall = async (req, res, next) => {
    try {
        const response = await callService.initiateCall({
            ...req.body,
            callerId: req.user?.id || req.body.callerId,
            guestIp: req.body.guestIp || req.ip,
        });
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.initiateCallFromChat = async (req, res, next) => {
    try {
        const response = await callService.initiateCallFromChat(req.user?.id || req.body.callerId, req.body.chatSessionId);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.updateCallStatus = async (req, res, next) => {
    try {
        const response = await callService.updateCallStatus(req.params.id, getActorId(req), req.body.status, req.body.endedReason);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getCallSession = async (req, res, next) => {
    try {
        const response = await callService.getCallSessionForActor(req.params.id, getActorId(req));
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getCallHistory = async (req, res, next) => {
    try {
        const response = await callService.getUserCallHistory(getActorId(req), req.query.limit);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getActiveCalls = async (req, res, next) => {
    try {
        const response = await callService.getActiveCalls(getActorId(req));
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.ringCall = async (req, res, next) => {
    try {
        const response = await callService.ringCall(req.params.id, getActorId(req));
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.acceptCall = async (req, res, next) => {
    try {
        const response = await callService.acceptCall(req.params.id, getActorId(req));
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.rejectCall = async (req, res, next) => {
    try {
        const response = await callService.rejectCall(req.params.id, getActorId(req));
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.endCall = async (req, res, next) => {
    try {
        const response = await callService.endCall(req.params.id, getActorId(req), req.body.endedReason);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getCallDuration = async (req, res, next) => {
    try {
        const response = await callService.getCallDuration(req.params.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getDailyCallCount = async (req, res, next) => {
    try {
        const response = await callService.getDailyCallCount(req.params.userId);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};
