'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('call_logs', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            account_id: { type: Sequelize.UUID, allowNull: false },
            call_request_id: { type: Sequelize.UUID, allowNull: false },
            caller_id: { type: Sequelize.STRING, allowNull: true },
            receiver_id: { type: Sequelize.STRING, allowNull: true },
            caller_name: { type: Sequelize.STRING, allowNull: true },
            receiver_name: { type: Sequelize.STRING, allowNull: true },
            caller_phone: { type: Sequelize.STRING, allowNull: true },
            receiver_phone: { type: Sequelize.STRING, allowNull: true },
            requested_at: { type: Sequelize.DATE, allowNull: false },
            accepted_at: { type: Sequelize.DATE, allowNull: true },
            metadata : { type: Sequelize.JSON, allowNull: true },

            status: {
                type: Sequelize.ENUM('PENDING', 'RINGING', 'ACCEPTED', 'DECLINED', 'MISSED', 'FAILED', 'ENDED'),
                defaultValue: 'PENDING',
            },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
            deleted_at: { type: Sequelize.DATE, allowNull: true },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('call_logs');
    },
};
