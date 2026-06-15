"use strict";

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('chat_messages', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      roomId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      senderId: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      receiverId: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      messageType: {
        type: Sequelize.ENUM('text', 'image', 'file'),
        allowNull: false,
        defaultValue: 'text',
      },
      deliveredAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      readAt: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('chat_messages');
    // Drop enum type if the dialect created one (e.g., Postgres)
    try {
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_chat_messages_messageType";');
    } catch (e) {
      // ignore
    }
  },
};
