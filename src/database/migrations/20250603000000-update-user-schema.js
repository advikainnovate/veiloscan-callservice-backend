'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        try {
            await queryInterface.addColumn('users', 'phone', {
                type: Sequelize.STRING,
                allowNull: true,
                unique: true,
            });
        } catch (err) {
            // column probably already exists
        }

        try {
            await queryInterface.addColumn('users', 'emergencyContact', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        } catch (err) {
            // column probably already exists
        }

        try {
            await queryInterface.addColumn('users', 'isBlock', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        } catch (err) {
            // column probably already exists
        }

        try {
            await queryInterface.renameColumn('users', 'userType', 'role');
        } catch (err) {
            // rename may fail if column does not exist or already renamed
        }

        try {
            await queryInterface.changeColumn('users', 'role', {
                type: Sequelize.STRING,
                allowNull: false,
                defaultValue: 'user',
            });
        } catch (err) {
            // change may fail if column missing or already has expected type
        }

        try {
            await queryInterface.sequelize.query('UPDATE "users" SET "phone" = "phoneNumber" WHERE "phoneNumber" IS NOT NULL;');
        } catch (err) {
            // ignore if update fails
        }

        try {
            await queryInterface.removeColumn('users', 'phoneNumber');
        } catch (err) {
            // ignore if column does not exist
        }
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.addColumn('users', 'phoneNumber', {
            type: Sequelize.STRING,
            allowNull: true,
            unique: true,
        });

        await queryInterface.sequelize.query('UPDATE "users" SET "phoneNumber" = "phone" WHERE "phone" IS NOT NULL;');
        await queryInterface.removeColumn('users', 'phone');
        await queryInterface.removeColumn('users', 'emergencyContact');
        await queryInterface.removeColumn('users', 'isBlock');

        await queryInterface.renameColumn('users', 'role', 'userType');
        await queryInterface.changeColumn('users', 'userType', {
            type: Sequelize.STRING,
            allowNull: false,
            defaultValue: 'client',
        });
    },
};
