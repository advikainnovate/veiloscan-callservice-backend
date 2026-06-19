const db = require('../database/models');

const create = async (data) => {
    return db.Organization.create(data);
};

const findById = async (id) => {
    return db.Organization.findByPk(id);
};

const update = async (id, data) => {
    await db.Organization.update(data, { where: { id } });
    return findById(id);
};

const deleteById = async (id) => {
    return db.Organization.destroy({ where: { id } });
};

const createApiKey = async (data) => {
    return db.ApiKey.create(data);
};

const getApiKeys = async (organizationId) => {
    return db.ApiKey.findAll({
        where: { organizationId },
        attributes: { exclude: ['apiKeyHash'] },
        order: [['createdAt', 'DESC']],
    });
};

const findApiKeyById = async (id) => {
    return db.ApiKey.findByPk(id);
};

const revokeApiKey = async (id, organizationId) => {
    return db.ApiKey.update(
        { isActive: false },
        { where: { id, organizationId } }
    );
};

module.exports = {
    create,
    findById,
    update,
    delete: deleteById,
    createApiKey,
    getApiKeys,
    findApiKeyById,
    revokeApiKey,
};
