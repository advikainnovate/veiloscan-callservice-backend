const { CallSession } = require('../database/models');

const create = async (payload) => {
    return CallSession.create(payload);
};

const findBySessionId = async (sessionId) => {
    return CallSession.findOne({
        where: { sessionId },
    });
};

const update = async (sessionId, payload) => {
    await CallSession.update(payload, {
        where: { sessionId },
    });

    return findBySessionId(sessionId);
};

module.exports = {
    create,
    findBySessionId,
    update,
};
