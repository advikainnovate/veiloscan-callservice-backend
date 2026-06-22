const crypto = require('crypto');
const callRepository = require('../../repository/call.repository');

const createSession = async (clientId, { callerUserId, calleeUserId, hasVideo = false } = {}) => {
    return callRepository.create({
        sessionId: crypto.randomUUID(),
        clientId,
        callerUserId: callerUserId || null,
        calleeUserId: calleeUserId || null,
        hasVideo,
        status: 'idle',
    });
};

const getSession = async (sessionId) => {
    return callRepository.findBySessionId(sessionId);
};

const ringSession = async (sessionId) => {
    return callRepository.update(sessionId, { status: 'ringing' });
};

const activateSession = async (sessionId) => {
    return callRepository.update(sessionId, {
        status: 'connected',
        startedAt: new Date(),
    });
};

const acceptSession = async (sessionId) => {
    return callRepository.update(sessionId, { status: 'connecting' });
};

const rejectSession = async (sessionId) => {
    const session = await callRepository.findBySessionId(sessionId);
    if (!session) return null;

    return callRepository.update(sessionId, {
        status: 'ended',
        endedAt: new Date(),
        durationSeconds: 0,
    });
};

const endSession = async (sessionId) => {
    const session = await callRepository.findBySessionId(sessionId);
    if (!session) return null; // socket-only session — nothing to update

    const endedAt = new Date();
    const durationSeconds = session.startedAt
        ? Math.floor((endedAt - session.startedAt) / 1000)
        : 0;

    return callRepository.update(sessionId, {
        status: 'ended',
        endedAt,
        durationSeconds,
    });
};

const failSession = async (sessionId) => {
    const session = await callRepository.findBySessionId(sessionId);
    if (!session) return null;

    return callRepository.update(sessionId, {
        status: 'failed',
        endedAt: new Date(),
    });
};

const pauseSession = async (sessionId) => {
    return callRepository.update(sessionId, { status: 'connecting' });
};

const resumeSession = async (sessionId) => {
    return callRepository.update(sessionId, { status: 'connected' });
};

module.exports = {
    createSession,
    getSession,
    ringSession,
    activateSession,
    acceptSession,
    rejectSession,
    endSession,
    failSession,
    pauseSession,
    resumeSession,
};
