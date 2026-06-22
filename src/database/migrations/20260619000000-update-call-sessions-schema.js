'use strict';

/**
 * Adds callerUserId, calleeUserId, hasVideo to call_sessions.
 * Replaces old ENUM ('created','active','paused','ended') with full status set.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        // 1. Add new columns
        await queryInterface.addColumn('call_sessions', 'callerUserId', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('call_sessions', 'calleeUserId', {
            type: Sequelize.STRING,
            allowNull: true,
        });

        await queryInterface.addColumn('call_sessions', 'hasVideo', {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
        });

        // 2. Migrate status column to VARCHAR, drop old ENUM, recreate with full set
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" TYPE VARCHAR(50);
        `);

        await queryInterface.sequelize.query(`
            DROP TYPE IF EXISTS "enum_call_sessions_status";
        `);

        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_call_sessions_status"
                AS ENUM ('idle','ringing','connecting','connected','paused','ended','failed');
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" TYPE "enum_call_sessions_status"
                USING "status"::"enum_call_sessions_status";
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" SET DEFAULT 'idle';
        `);
    },

    async down(queryInterface, Sequelize) {
        // Remove added columns
        await queryInterface.removeColumn('call_sessions', 'callerUserId');
        await queryInterface.removeColumn('call_sessions', 'calleeUserId');
        await queryInterface.removeColumn('call_sessions', 'hasVideo');

        // Revert status ENUM to original
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" TYPE VARCHAR(50);
        `);
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_call_sessions_status";`);
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_call_sessions_status"
                AS ENUM ('created','active','paused','ended');
        `);
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" TYPE "enum_call_sessions_status"
                USING (
                    CASE "status"
                        WHEN 'connected' THEN 'active'
                        WHEN 'connecting' THEN 'created'
                        WHEN 'failed' THEN 'ended'
                        WHEN 'idle' THEN 'created'
                        WHEN 'ringing' THEN 'created'
                        ELSE "status"
                    END
                )::"enum_call_sessions_status";
        `);
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" SET DEFAULT 'created';
        `);
    },
};
