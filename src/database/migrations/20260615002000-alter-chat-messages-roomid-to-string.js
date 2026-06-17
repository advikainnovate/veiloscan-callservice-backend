'use strict';

module.exports = {
    async up(queryInterface, Sequelize) {
        // Ensure column is UUID before altering to STRING
        const tableDesc = await queryInterface.describeTable('chat_messages');
        if (tableDesc['roomId'] && tableDesc['roomId'].type !== 'STRING') {
            // Drop foreign key constraint if exists
            await queryInterface.sequelize.query('ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_roomId_fkey";');
            await queryInterface.changeColumn('chat_messages', 'roomId', {
                type: Sequelize.STRING,
                allowNull: false,
            });
        }
        // Alter receiverId to STRING (allow null) if not already
        if (tableDesc['receiverId'] && tableDesc['receiverId'].type !== 'STRING') {
            await queryInterface.changeColumn('chat_messages', 'receiverId', {
                type: Sequelize.STRING,
                allowNull: true,
            });
        }
    },

    async down(queryInterface, Sequelize) {
        // Revert roomId back to UUID using USING cast
        const tableDesc = await queryInterface.describeTable('chat_messages');
        if (tableDesc['roomId'] && tableDesc['roomId'].type !== 'UUID') {
            await queryInterface.sequelize.query('ALTER TABLE "chat_messages" ALTER COLUMN "roomId" TYPE UUID USING "roomId"::uuid;');
        }
        // Revert receiverId back to STRING NOT NULL (if needed)
        if (tableDesc['receiverId'] && tableDesc['receiverId'].type !== 'STRING') {
            await queryInterface.changeColumn('chat_messages', 'receiverId', {
                type: Sequelize.STRING,
                allowNull: false,
            });
        }
    },
};
