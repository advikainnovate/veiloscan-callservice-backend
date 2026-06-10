const crypto = require("crypto");

const callRepository =
    require("../../repository/call.repository");

const createSession = async (
    clientId
) => {

    return callRepository.create({
        sessionId:
            crypto.randomUUID(),
        clientId,
        status: "created"
    });
};

const activateSession = async (
    sessionId
) => {

    return callRepository.update(
        sessionId,
        {
            status: "active",
            startedAt: new Date()
        }
    );
};

const endSession = async (
    sessionId
) => {

    const session =
        await callRepository.findBySessionId(
            sessionId
        );

    if (!session) {
        throw new Error(
            "Session not found"
        );
    }

    const endedAt = new Date();

    const durationSeconds =
        Math.floor(
            (endedAt -
                session.startedAt) /
            1000
        );

    return callRepository.update(
        sessionId,
        {
            status: "ended",
            endedAt,
            durationSeconds
        }
    );
};

module.exports = {
    createSession,
    activateSession,
    endSession
};