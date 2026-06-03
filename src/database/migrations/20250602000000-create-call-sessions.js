'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('call_sessions', {
            id: {
                type: Sequelize.UUID,
                defaultValue: Sequelize.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            callerId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            receiverId: {
                type: Sequelize.UUID,
                allowNull: false,
                references: {
                    model: 'users',
                    key: 'id',
                },
                onDelete: 'CASCADE',
                onUpdate: 'CASCADE',
            },
            qrId: {
                type: Sequelize.UUID,
                allowNull: false,
            },
            guestId: {
                type: Sequelize.STRING(100),
                allowNull: true,
            },
            guestIp: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            callerType: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'registered',
            },
            status: {
                type: Sequelize.STRING(20),
                allowNull: false,
                defaultValue: 'initiated',
            },
            endedReason: {
                type: Sequelize.STRING(50),
                allowNull: true,
            },
            initiatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
            },
            startedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
            endedAt: {
                type: Sequelize.DATE,
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

        try {
            await queryInterface.addIndex('call_sessions', ['callerId'], {
                name: 'call_sessions_caller_id_idx',
            });
        } catch (err) {
            // ignore index already exists error
        }

        try {
            await queryInterface.addIndex('call_sessions', ['receiverId'], {
                name: 'call_sessions_receiver_id_idx',
            });
        } catch (err) {
            // ignore index already exists error
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('call_sessions');
    },
};
