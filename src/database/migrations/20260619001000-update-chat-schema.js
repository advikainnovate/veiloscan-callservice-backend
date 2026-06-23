'use strict';

/**
 * Adds message status ENUM to chat_messages.
 * Adds conversation status ENUM to chat_rooms.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // ── chat_messages: add status column ──────────────────────────────────
        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS "enum_chat_messages_status";
        `);
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_chat_messages_status"
                AS ENUM ('sending', 'sent', 'delivered', 'read', 'failed');
        `);
        await queryInterface.addColumn('chat_messages', 'status', {
            type: Sequelize.ENUM('sending', 'sent', 'delivered', 'read', 'failed'),
            defaultValue: 'sent',
            allowNull: false,
        });

        // ── chat_rooms: add status column ──────────────────────────────────────
        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS "enum_chat_rooms_status";
        `);
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_chat_rooms_status"
                AS ENUM ('active', 'archived', 'closed');
        `);
        await queryInterface.addColumn('chat_rooms', 'status', {
            type: Sequelize.ENUM('active', 'archived', 'closed'),
            defaultValue: 'active',
            allowNull: false,
        });
    },

    async down(queryInterface) {
        await queryInterface.removeColumn('chat_messages', 'status');
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_chat_messages_status";`);

        await queryInterface.removeColumn('chat_rooms', 'status');
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_chat_rooms_status";`);
    },
};
