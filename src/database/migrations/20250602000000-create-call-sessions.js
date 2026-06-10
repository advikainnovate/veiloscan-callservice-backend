'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_call_sessions_status";');

        await queryInterface.createTable('call_sessions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            sessionId: {
                type: Sequelize.UUID,
                allowNull: false,
                unique: true,
            },
            clientId: {
                type: Sequelize.STRING,
                allowNull: false,
            },
            status: {
                type: Sequelize.ENUM('created', 'active', 'ended'),
                allowNull: false,
                defaultValue: 'created',
            },
            startedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            endedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            durationSeconds: {
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
        });

        try {
            await queryInterface.addIndex('call_sessions', ['status'], {
                name: 'call_sessions_status_idx',
            });
        } catch (err) {
            // ignore index already exists error
        }

        try {
            await queryInterface.addIndex('call_sessions', ['startedAt'], {
                name: 'call_sessions_started_at_idx',
            });
        } catch (err) {
            // ignore index already exists error
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('call_sessions');
        await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_call_sessions_status";');
    },
};
