'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('chat_requests', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            account_id: { type: Sequelize.UUID, allowNull: false },
            api_key_id: { type: Sequelize.UUID, allowNull: false },
            sender_id: { type: Sequelize.STRING, allowNull: false },
            receiver_id: { type: Sequelize.STRING, allowNull: false },
            sender_name: { type: Sequelize.STRING, allowNull: true },
            receiver_name: { type: Sequelize.STRING, allowNull: true },
            status: {
                type: Sequelize.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CLOSED'),
                defaultValue: 'PENDING',
            },
            created_at: { type: Sequelize.DATE, allowNull: false },
            updated_at: { type: Sequelize.DATE, allowNull: false },
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chat_requests_status";');
        await queryInterface.dropTable('chat_requests');
    },
};
