const Joi = require('joi');

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const callSchema = {
    initiate: {
        body: Joi.object().keys({
            callerId: uuid.optional(),
            receiverId: uuid.optional(),
            qrId: uuid.optional(),
            qrToken: Joi.string().trim().optional(),
            guestId: Joi.string().trim().optional(),
            guestIp: Joi.string().trim().optional(),
        }),
    },
    actorQuery: {
        query: Joi.object().keys({
            userId: Joi.string().trim().optional(),
            limit: Joi.number().integer().min(1).max(100).optional(),
        }),
    },
    updateStatus: {
        body: Joi.object().keys({
            userId: Joi.string().trim().optional(),
            status: Joi.string().valid('ringing', 'connected', 'ended', 'failed').required(),
            endedReason: Joi.string().valid('completed', 'rejected', 'busy', 'timeout', 'error').optional(),
        }),
    },
    initiateFromChat: {
        body: Joi.object().keys({
            callerId: uuid.optional(),
            chatSessionId: uuid.required(),
        }),
    },
    action: {
        body: Joi.object().keys({
            userId: Joi.string().trim().optional(),
            endedReason: Joi.string().valid('completed', 'rejected', 'busy', 'timeout', 'error').optional(),
        }),
    },
};

module.exports = { callSchema };
