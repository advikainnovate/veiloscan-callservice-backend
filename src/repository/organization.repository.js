const db = require('../database/models');

class OrganizationRepository {
    async create(data) {
        return db.Organization.create(data);
    }

    async findAll() {
        return db.Organization.findAll({
            order: [['createdAt', 'DESC']],
        });
    }

    async findById(id) {
        return db.Organization.findByPk(id);
    }

    async update(id, data) {
        await db.Organization.update(data, {
            where: { id },
        });

        return this.findById(id);
    }

    async delete(id) {
        return db.Organization.destroy({
            where: { id },
        });
    }

    async createApiKey(data) {
        return db.ApiKey.create(data);
    }

    async getApiKeys(organizationId) {
        return db.ApiKey.findAll({
            where: {
                organizationId,
            },
            attributes: {
                exclude: ['apiKeyHash'],
            },
            order: [['createdAt', 'DESC']],
        });
    }

    async findApiKeyById(id) {
        return db.ApiKey.findByPk(id);
    }

    async revokeApiKey(id, organizationId) {
        return db.ApiKey.update(
            {
                isActive: false,
            },
            {
                where: { id, organizationId },
            }
        );
    }
}

module.exports = new OrganizationRepository();
