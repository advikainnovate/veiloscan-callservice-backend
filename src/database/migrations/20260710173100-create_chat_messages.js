'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('chat_messages', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            chat_request_id: { type: Sequelize.UUID, allowNull: false },
            account_id: { type: Sequelize.UUID, allowNull: false },
            sender_id: { type: Sequelize.STRING, allowNull: false },
            receiver_id: { type: Sequelize.STRING, allowNull: false },
            message: { type: Sequelize.TEXT, allowNull: true },
            type: {
                type: Sequelize.ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'LOCATION'),
                defaultValue: 'TEXT',
            },
            attachment_url: { type: Sequelize.STRING, allowNull: true },
            status: {
                type: Sequelize.ENUM('SENT', 'DELIVERED', 'READ'),
                defaultValue: 'SENT',
            },
            created_at: { type: Sequelize.DATE, allowNull: false },
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chat_messages_type";');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chat_messages_status";');
        await queryInterface.dropTable('chat_messages');
    },
};
