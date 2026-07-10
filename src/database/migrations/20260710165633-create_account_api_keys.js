'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('account_api_keys', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            account_id: { type: Sequelize.UUID, allowNull: false },
            name: { type: Sequelize.STRING, allowNull: false },
            api_hash_key: { type: Sequelize.STRING, allowNull: false },
            remark: { type: Sequelize.STRING, allowNull: true },
            status: { type: Sequelize.ENUM('active', 'inactive'), defaultValue: 'active' },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
            deleted_at: { type: Sequelize.DATE, allowNull: true },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('account_api_keys');
    },
};
