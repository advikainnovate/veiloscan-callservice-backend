'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('users', {
            id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, allowNull: false, primaryKey: true },
            idd: { type: Sequelize.STRING, allowNull: true, unique: true },
            userType: {
                type: Sequelize.STRING,
                defaultValue: 'client',
            },
            username: { type: Sequelize.STRING, allowNull: false, unique: true },
            display_name: { type: Sequelize.STRING, allowNull: true },
            email: { type: Sequelize.STRING, allowNull: false },
            password: { type: Sequelize.STRING, allowNull: false },
            countryCode: { type: Sequelize.STRING, allowNull: true },
            phoneNumber: { type: Sequelize.STRING, allowNull: true },
            phoneVerification: { type: Sequelize.BOOLEAN, defaultValue: false },
            emailVerification: { type: Sequelize.BOOLEAN, defaultValue: false },
            gender: { type: Sequelize.ENUM('male', 'female', 'other'), defaultValue: 'male' },
            status: { type: Sequelize.STRING, defaultValue: 'pending' },
            createdAt: { type: Sequelize.DATE, allowNull: false },
            updatedAt: { type: Sequelize.DATE, allowNull: false },
            deletedAt: { type: Sequelize.DATE, allowNull: true },
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('users');
    },
};
