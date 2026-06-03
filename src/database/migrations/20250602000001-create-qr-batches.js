'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('qr_batches', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            batchNumber: { type: Sequelize.STRING(50), allowNull: false, unique: true },
            purpose: { type: Sequelize.STRING(20), allowNull: false },
            status: { type: Sequelize.STRING(30), allowNull: false },
            quantity: { type: Sequelize.INTEGER, allowNull: false },
            createdBy: {
                type: Sequelize.UUID,
                allowNull: true,
                references: { model: 'users', key: 'id' },
                onDelete: 'SET NULL',
                onUpdate: 'CASCADE',
            },
            notes: { type: Sequelize.TEXT, allowNull: true },
            printJobRef: { type: Sequelize.STRING(100), allowNull: true },
            distributedAt: { type: Sequelize.DATE, allowNull: true },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        });

        try {
            await queryInterface.addIndex('qr_batches', ['batchNumber'], { name: 'qr_batches_batch_number_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }

        try {
            await queryInterface.addIndex('qr_batches', ['purpose'], { name: 'qr_batches_purpose_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }

        try {
            await queryInterface.addIndex('qr_batches', ['status'], { name: 'qr_batches_status_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }

        try {
            await queryInterface.addIndex('qr_batches', ['createdBy'], { name: 'qr_batches_created_by_idx' });
        } catch (err) {
            // ignore if index or column already exists
        }
    },

    async down(queryInterface) {
        await queryInterface.dropTable('qr_batches');
    },
};
