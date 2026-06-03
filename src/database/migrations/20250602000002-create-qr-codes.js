'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('qr_codes', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            token: { type: Sequelize.STRING(255), allowNull: false, unique: true },
            humanToken: { type: Sequelize.STRING(20), allowNull: false, unique: true },
            assignedUserId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            batchId: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'qr_batches', key: 'id' },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            status: { type: Sequelize.STRING(20), allowNull: false, defaultValue: 'unassigned' },
            assignedAt: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        });

        try {
            await queryInterface.addIndex('qr_codes', ['token'], { name: 'qr_codes_token_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }

        try {
            await queryInterface.addIndex('qr_codes', ['humanToken'], { name: 'qr_codes_human_token_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }

        try {
            await queryInterface.addIndex('qr_codes', ['assignedUserId'], { name: 'qr_codes_assigned_user_id_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }

        try {
            await queryInterface.addIndex('qr_codes', ['batchId'], { name: 'qr_codes_batch_id_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }

        try {
            await queryInterface.addIndex('qr_codes', ['status'], { name: 'qr_codes_status_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('qr_codes');
    },
};
