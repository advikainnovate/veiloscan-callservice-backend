const Joi = require('joi');

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const chatSessionSchema = {
    initiate: {
        body: Joi.object().keys({
            qrToken: Joi.string().trim().required(),
        }),
    },
    params: {
        params: Joi.object().keys({
            chatSessionId: uuid.required(),
        }),
    },
    list: {
        query: Joi.object().keys({
            limit: Joi.number().integer().min(1).max(100).optional(),
        }),
    },
};

module.exports = { chatSessionSchema };
