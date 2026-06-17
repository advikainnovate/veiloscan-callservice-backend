const organizationService = require('./organization.service');

class OrganizationController {
    async createOrganization(req, res, next) {
        try {
            const organization = await organizationService.createOrganization(req.body);

            return res.status(201).json({
                success: true,
                data: organization,
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrganizations(req, res, next) {
        try {
            const organizations = await organizationService.getOrganizations();

            return res.status(200).json({
                success: true,
                data: organizations,
            });
        } catch (error) {
            next(error);
        }
    }

    async getOrganizationById(req, res, next) {
        try {
            const organization = await organizationService.getOrganizationById(req.params.id);

            return res.status(200).json({
                success: true,
                data: organization,
            });
        } catch (error) {
            next(error);
        }
    }

    async updateOrganization(req, res, next) {
        try {
            // Identity comes from the authenticated API key, not the URL
            const organizationId = req.organization.id;
            const organization = await organizationService.updateOrganization(organizationId, req.body);

            return res.status(200).json({
                success: true,
                data: organization,
            });
        } catch (error) {
            next(error);
        }
    }

    async deleteOrganization(req, res, next) {
        try {
            // Identity comes from the authenticated API key, not the URL
            const organizationId = req.organization.id;
            await organizationService.deleteOrganization(organizationId);

            return res.status(200).json({
                success: true,
                message: 'Organization deleted successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    async getMe(req, res, next) {
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
    }

    async createApiKey(req, res, next) {
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
    }

    async getApiKeys(req, res, next) {
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
    }

    async revokeApiKey(req, res, next) {
        try {
            // Ensure the key belongs to the authenticated org before revoking
            const organizationId = req.organization.id;
            await organizationService.revokeApiKey(req.params.apiKeyId, organizationId);

            return res.status(200).json({
                success: true,
                message: 'API key revoked successfully',
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OrganizationController();
