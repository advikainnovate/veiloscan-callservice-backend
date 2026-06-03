const Joi = require('joi');

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const qrCodeSchema = {
    createBatch: {
        body: Joi.object().keys({
            count: Joi.number().integer().valid(10, 25, 50, 100, 200, 500, 1000).required(),
            purpose: Joi.string().valid('printing', 'digital').required(),
            notes: Joi.string().trim().optional(),
            printJobRef: Joi.string().trim().optional(),
        }),
    },
    claim: {
        body: Joi.object()
            .keys({
                token: Joi.string().trim().optional(),
                humanToken: Joi.string().trim().optional(),
            })
            .or('token', 'humanToken'),
    },
    assign: {
        body: Joi.object().keys({
            userId: uuid.required(),
        }),
    },
    scan: {
        body: Joi.object()
            .keys({
                token: Joi.string().trim().optional(),
                humanToken: Joi.string().trim().optional(),
            })
            .or('token', 'humanToken'),
    },
    getUnassigned: {
        query: Joi.object().keys({
            limit: Joi.number().integer().min(1).max(100).optional(),
            cursor: Joi.string().trim().optional(),
        }),
    },
};

module.exports = { qrCodeSchema };
