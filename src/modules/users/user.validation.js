const Joi = require('joi');
const { CONSTANTS } = require('../../config');

const userSchema = {
    register: {
        body: Joi.object().keys({
            username: Joi.string().min(3).max(50).required(),
            phone: Joi.string().trim().optional(),
            email: Joi.string().trim().email().trim().required(),
            emergencyContact: Joi.string().trim().optional(),
            countryCode: Joi.string().trim().optional(),
            password: Joi.string().trim().required(),
            gender: Joi.string().valid('male', 'female', 'other').optional(),
        }),
    },
    login: {
        body: Joi.object().keys({
            email: Joi.string().trim().email().trim().required(),
            password: Joi.string().trim().required(),
        }),
    },
    create: {
        body: Joi.object().keys({
            username: Joi.string().min(3).max(50).required(),
            phone: Joi.string().trim().optional(),
            email: Joi.string().trim().email().trim().required(),
            emergencyContact: Joi.string().trim().optional(),
            countryCode: Joi.string().trim().optional(),
            password: Joi.string().trim().required(),
            gender: Joi.string().valid('male', 'female', 'other').optional(),
            role: Joi.string().valid(...Object.values(CONSTANTS.ROLE)).required(),
        }),
    },
    update: {
        body: Joi.object().keys({
            username: Joi.string().min(3).max(50).optional(),
            phone: Joi.string().trim().optional(),
            email: Joi.string().trim().email().trim().optional(),
            emergencyContact: Joi.string().trim().optional(),
            countryCode: Joi.string().trim().optional(),
            gender: Joi.string().valid('male', 'female', 'other').optional(),
            display_name: Joi.string().trim().optional(),
            status: Joi.string()
                .valid(...Object.values(CONSTANTS.USER_STATUS))
                .optional(),
            role: Joi.string().valid(...Object.values(CONSTANTS.ROLE)).optional(),
        }),
    },
    changePassword: {
        body: Joi.object().keys({
            currentPassword: Joi.string().trim().required(),
            newPassword: Joi.string().trim().required().invalid(Joi.ref('currentPassword')).messages({
                'any.invalid': 'New password must be different from current password',
            }),
            confirmPassword: Joi.string().trim().required().valid(Joi.ref('newPassword')).messages({
                'any.only': 'Confirm password must match new password',
            }),
        }),
    },
    findDisplayName: {
        body: Joi.object().keys({
            display_name: Joi.string().trim().required(),
        }),
    },
    updateStatus: {
        body: Joi.object().keys({
            status: Joi.string().trim().required(),
        }),
    },
};

module.exports = { userSchema };
