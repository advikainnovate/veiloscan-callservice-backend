const callService = require('./call.session.service');

const createSession = async (req, res, next) => {
    try {
        const { clientId, callerUserId, calleeUserId, hasVideo } = req.body;
        const session = await callService.createSession(clientId || 'unknown', {
            callerUserId,
            calleeUserId,
            hasVideo,
        });

        return res.status(201).json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
};

const getSession = async (req, res, next) => {
    try {
        const session = await callService.getSession(req.params.sessionId);

        if (!session) {
            return res.status(404).json({ success: false, message: 'Session not found' });
        }

        return res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
};

const endSession = async (req, res, next) => {
    try {
        const session = await callService.endSession(req.params.sessionId);

        return res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
};

const acceptSession = async (req, res, next) => {
    try {
        const session = await callService.acceptSession(req.params.sessionId);

        return res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
};

const rejectSession = async (req, res, next) => {
    try {
        const session = await callService.rejectSession(req.params.sessionId);

        return res.json({ success: true, data: session });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createSession,
    getSession,
    endSession,
    acceptSession,
    rejectSession,
};
