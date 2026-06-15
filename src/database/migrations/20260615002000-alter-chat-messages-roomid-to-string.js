'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop the actual foreign key constraint on roomId before altering the column
    await queryInterface.sequelize.query(
      'ALTER TABLE "chat_messages" DROP CONSTRAINT IF EXISTS "chat_messages_roomId_fkey";'
    );

    await queryInterface.changeColumn('chat_messages', 'roomId', {
      type: Sequelize.STRING,
      allowNull: false,
    });

    await queryInterface.changeColumn('chat_messages', 'receiverId', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('chat_messages', 'roomId', {
      type: Sequelize.UUID,
      allowNull: false,
    });

    await queryInterface.changeColumn('chat_messages', 'receiverId', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },
};
