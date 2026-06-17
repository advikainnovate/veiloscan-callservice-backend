const trackCallRequest = async (req, res, next) => {
    try {
        if (req.organization) {
            await req.organization.increment("callRequestsCount", { by: 1 });
        }
        next();
    } catch (error) {
        next(error);
    }
};

const trackChatRequest = async (req, res, next) => {
    try {
        if (req.organization) {
            await req.organization.increment("chatRequestsCount", { by: 1 });
        }
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    trackCallRequest,
    trackChatRequest,
};
