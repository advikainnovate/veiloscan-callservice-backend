'use strict';

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable('api_keys', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            organizationId: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            name: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            apiKeyHash: {
                type: Sequelize.STRING(255),
                allowNull: false,
                unique: true,
            },
            isActive: {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
            lastUsedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            createdAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
            updatedAt: {
                allowNull: false,
                type: Sequelize.DATE,
            },
        });

        await queryInterface.addIndex('api_keys', ['apiKeyHash'], {
            unique: true,
            name: 'api_keys_apiKeyHash_unique',
        });

        await queryInterface.addIndex('api_keys', ['organizationId'], {
            name: 'api_keys_organizationId_index',
        });
    },

    down: async (queryInterface, Sequelize) => {
        await queryInterface.dropTable('api_keys');
    },
};
