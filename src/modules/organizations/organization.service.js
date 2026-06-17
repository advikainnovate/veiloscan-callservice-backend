const crypto = require('crypto');
const organizationRepository = require('../../repository/organization.repository');

class OrganizationService {
    generateApiKey() {
        return `cp_live_${crypto.randomBytes(32).toString('hex')}`;
    }

    hashApiKey(apiKey) {
        return crypto.createHash('sha256').update(apiKey).digest('hex');
    }

    async createOrganization(data) {
        return organizationRepository.create(data);
    }

    async getOrganizations() {
        return organizationRepository.findAll();
    }

    async getOrganizationById(id) {
        return organizationRepository.findById(id);
    }

    async updateOrganization(id, data) {
        return organizationRepository.update(id, data);
    }

    async deleteOrganization(id) {
        return organizationRepository.delete(id);
    }

    async createApiKey(organizationId, name) {
        const rawApiKey = this.generateApiKey();

        const apiKeyHash = this.hashApiKey(rawApiKey);

        await organizationRepository.createApiKey({
            organizationId,
            name,
            apiKeyHash,
            isActive: true,
        });

        return {
            apiKey: rawApiKey,
        };
    }

    async getApiKeys(organizationId) {
        return organizationRepository.getApiKeys(organizationId);
    }

    async revokeApiKey(apiKeyId, organizationId) {
        return organizationRepository.revokeApiKey(apiKeyId, organizationId);
    }
}

module.exports = new OrganizationService();
