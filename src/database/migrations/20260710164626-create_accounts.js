'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('accounts', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            idd: { type: Sequelize.STRING, allowNull: true, unique: true },
            user_id: { type: Sequelize.UUID, allowNull: false },
            society_id: { type: Sequelize.UUID, allowNull: true },
            remark: { type: Sequelize.STRING, allowNull: true },
            status: { type: Sequelize.ENUM('active', 'inactive', 'pending', 'hold', 'blocked'), defaultValue: 'pending' },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
            deleted_at: { type: Sequelize.DATE, allowNull: true },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('accounts');
    },
};
