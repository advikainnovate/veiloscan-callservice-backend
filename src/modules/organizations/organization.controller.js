const organizationService = require('./organization.service');

const createOrganization = async (req, res, next) => {
    try {
        const organization = await organizationService.createOrganization(req.body);

        return res.status(201).json({
            success: true,
            data: organization,
        });
    } catch (error) {
        next(error);
    }
};

const updateOrganization = async (req, res, next) => {
    try {
        const organizationId = req.organization.id;
        const organization = await organizationService.updateOrganization(organizationId, req.body);

        return res.status(200).json({
            success: true,
            data: organization,
        });
    } catch (error) {
        next(error);
    }
};

const deleteOrganization = async (req, res, next) => {
    try {
        const organizationId = req.organization.id;
        await organizationService.deleteOrganization(organizationId);

        return res.status(200).json({
            success: true,
            message: 'Organization deleted successfully',
        });
    } catch (error) {
        next(error);
    }
};

const getMe = async (req, res, next) => {
    try {
        const organizationId = req.organization.id;
        const organization = await organizationService.getOrganizationById(organizationId);
        const apiKeys = await organizationService.getApiKeys(organizationId);

        return res.status(200).json({
            success: true,
            data: {
                organization,
                apiKeys,
            },
        });
    } catch (error) {
        next(error);
    }
};

const createApiKey = async (req, res, next) => {
    try {
        const { name } = req.body;
        const apiKey = await organizationService.createApiKey(req.params.id, name);

        return res.status(201).json({
            success: true,
            data: apiKey,
        });
    } catch (error) {
        next(error);
    }
};

const getApiKeys = async (req, res, next) => {
    try {
        const organizationId = req.organization.id;
        const apiKeys = await organizationService.getApiKeys(organizationId);

        return res.status(200).json({
            success: true,
            data: apiKeys,
        });
    } catch (error) {
        next(error);
    }
};

const revokeApiKey = async (req, res, next) => {
    try {
        const organizationId = req.organization.id;
        await organizationService.revokeApiKey(req.params.apiKeyId, organizationId);

        return res.status(200).json({
            success: true,
            message: 'API key revoked successfully',
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createOrganization,
    updateOrganization,
    deleteOrganization,
    getMe,
    createApiKey,
    getApiKeys,
    revokeApiKey,
};
