const db = require('../database/models');
const { UnauthorizedException } = require('../helpers/errorResponse');
const { hashApiKey } = require('../utils/apikey');

const apiKeyAuth = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];

        if (!apiKey) {
            throw new UnauthorizedException('API key is required');
        }

        const apiKeyHash = hashApiKey(apiKey);

        const key = await db.ApiKey.findOne({
            where: {
                apiKeyHash,
                isActive: true,
            },
            include: [
                {
                    model: db.Organization,
                    as: 'organization',
                },
            ],
        });

        if (!key) {
            throw new UnauthorizedException('Invalid API key');
        }

        if (!key.organization || !key.organization.isActive) {
            throw new UnauthorizedException('Organization is inactive');
        }

        await key.update({
            lastUsedAt: new Date(),
        });

        req.organization = key.organization;
        req.apiKey = key;

        next();
    } catch (error) {
        next(error);
    }
};

const socketApiKeyAuth = async (socket, next) => {
    try {
        const apiKey = socket.handshake.auth?.apiKey;

        if (!apiKey) {
            return next(new Error('API key is required'));
        }

        const apiKeyHash = hashApiKey(apiKey);

        const key = await db.ApiKey.findOne({
            where: {
                apiKeyHash,
                isActive: true,
            },
            include: [
                {
                    model: db.Organization,
                    as: 'organization',
                },
            ],
        });

        if (!key) {
            return next(new Error('Invalid API key'));
        }

        if (!key.organization || !key.organization.isActive) {
            return next(new Error('Organization is inactive'));
        }

        await key.update({
            lastUsedAt: new Date(),
        });

        socket.organizationId = key.organizationId;
        socket.organization = key.organization;

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    apiKeyAuth,
    socketApiKeyAuth,
};
