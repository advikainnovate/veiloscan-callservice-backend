const organizationRepository = require('../../repository/organization.repository');
const { generateApiKey, hashApiKey } = require('../../utils/apikey');

const buildOrganizationPayload = (data = {}) => {
    const payload = {};

    if (Object.prototype.hasOwnProperty.call(data, 'name')) {
        payload.name = data.name;
    }

    return payload;
};

const createOrganization = async (data) => {
    return organizationRepository.create({
        ...buildOrganizationPayload(data),
        isActive: true,
    });
};

const getOrganizationById = async (id) => {
    return organizationRepository.findById(id);
};

const updateOrganization = async (id, data) => {
    return organizationRepository.update(id, buildOrganizationPayload(data));
};

const deleteOrganization = async (id) => {
    return organizationRepository.delete(id);
};

const createApiKey = async (organizationId, name) => {
    const rawApiKey = generateApiKey();
    const apiKeyHash = hashApiKey(rawApiKey);

    await organizationRepository.createApiKey({
        organizationId,
        name,
        apiKeyHash,
        isActive: true,
    });

    return { apiKey: rawApiKey };
};

const getApiKeys = async (organizationId) => {
    return organizationRepository.getApiKeys(organizationId);
};

const revokeApiKey = async (apiKeyId, organizationId) => {
    return organizationRepository.revokeApiKey(apiKeyId, organizationId);
};

module.exports = {
    createOrganization,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    createApiKey,
    getApiKeys,
    revokeApiKey,
};
