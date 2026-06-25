'use strict';

/**
 * Adds callerUserId, calleeUserId, hasVideo to call_sessions.
 * Replaces old ENUM with full status set: idle/ringing/connecting/connected/paused/ended/failed
 *
 * Idempotent — safe to re-run if a previous attempt partially succeeded.
 */
module.exports = {
    async up(queryInterface, Sequelize) {
        const table = await queryInterface.describeTable('call_sessions');

        // 1. Add columns only if they don't exist yet
        if (!table['callerUserId']) {
            await queryInterface.addColumn('call_sessions', 'callerUserId', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        if (!table['calleeUserId']) {
            await queryInterface.addColumn('call_sessions', 'calleeUserId', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }

        if (!table['hasVideo']) {
            await queryInterface.addColumn('call_sessions', 'hasVideo', {
                type: Sequelize.BOOLEAN,
                allowNull: false,
                defaultValue: false,
            });
        }

        // 2. Rebuild the status ENUM with the full set
        // Drop default first so the type is not referenced, then alter safely
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" DROP DEFAULT;
        `);

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

        // Map any legacy values that may be in existing rows
        await queryInterface.sequelize.query(`
            UPDATE "call_sessions" SET "status" = 'ended'
                WHERE "status" NOT IN ('idle','ringing','connecting','connected','paused','ended','failed');
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" TYPE "enum_call_sessions_status"
                USING "status"::"enum_call_sessions_status";
        `);

        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" SET DEFAULT 'idle'::"enum_call_sessions_status";
        `);
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.removeColumn('call_sessions', 'callerUserId');
        await queryInterface.removeColumn('call_sessions', 'calleeUserId');
        await queryInterface.removeColumn('call_sessions', 'hasVideo');

        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" DROP DEFAULT;
        `);
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
            UPDATE "call_sessions" SET "status" = 'ended'
                WHERE "status" NOT IN ('created','active','paused','ended');
        `);
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" TYPE "enum_call_sessions_status"
                USING "status"::"enum_call_sessions_status";
        `);
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" SET DEFAULT 'created'::"enum_call_sessions_status";
        `);
    },
};
