'use strict';

module.exports = {
    async up(queryInterface) {
        // Add 'paused' to the call_sessions status ENUM (Postgres)
        await queryInterface.sequelize.query(`
            ALTER TYPE "enum_call_sessions_status" ADD VALUE IF NOT EXISTS 'paused';
        `);
    },

    async down(queryInterface) {
        // Postgres does not support removing ENUM values directly.
        // To rollback: recreate the type without 'paused' and update the column.
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" TYPE VARCHAR(255);
        `);
        await queryInterface.sequelize.query(`DROP TYPE IF EXISTS "enum_call_sessions_status";`);
        await queryInterface.sequelize.query(`
            CREATE TYPE "enum_call_sessions_status" AS ENUM ('created', 'active', 'ended');
        `);
        await queryInterface.sequelize.query(`
            ALTER TABLE "call_sessions"
                ALTER COLUMN "status" TYPE "enum_call_sessions_status"
                USING "status"::"enum_call_sessions_status";
        `);
    },
};
