const callService =
    require("./callSession.service");

exports.createSession =
async (req, res, next) => {

    try {

        const { clientId } = req.body;

        const session =
            await callService.createSession(
                clientId || "unknown"
            );

        return res.status(201).json({
            success: true,
            data: session
        });

    } catch (err) {
        next(err);
    }
};

exports.getSession =
async (req, res, next) => {

    try {

        const session =
            await callService.getSession(
                req.params.sessionId
            );

        return res.json({
            success: true,
            data: session
        });

    } catch (err) {
        next(err);
    }
};

exports.endSession =
async (req, res, next) => {

    try {

        const session =
            await callService.endSession(
                req.params.sessionId
            );

        return res.json({
            success: true,
            data: session
        });

    } catch (err) {
        next(err);
    }
};