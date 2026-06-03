'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('chat_sessions', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            qrId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'qr_codes', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            participant1Id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            participant2Id: {
                type: Sequelize.UUID,
                allowNull: false,
                references: { model: 'users', key: 'id' },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'active' },
            startedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            endedAt: { type: Sequelize.DATE, allowNull: true },
            lastMessageAt: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        });

        try {
            await queryInterface.addIndex('chat_sessions', ['status'], { name: 'chat_sessions_status_idx' });
        } catch (err) {
            // ignore if index already exists
        }

        try {
            await queryInterface.addIndex('chat_sessions', ['participant1Id'], { name: 'chat_sessions_participant1_id_idx' });
        } catch (err) {
            // ignore if index already exists
        }

        try {
            await queryInterface.addIndex('chat_sessions', ['participant2Id'], { name: 'chat_sessions_participant2_id_idx' });
        } catch (err) {
            // ignore if index already exists
        }

        try {
            await queryInterface.addIndex('chat_sessions', ['lastMessageAt'], { name: 'chat_sessions_last_message_at_idx' });
        } catch (err) {
            // ignore if index already exists
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('chat_sessions');
    },
};
