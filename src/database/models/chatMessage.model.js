const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ChatMessage extends Model {
        static associate(models) {
            ChatMessage.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
            ChatMessage.belongsTo(models.ChatRequest, { foreignKey: 'chatRequestId', as: 'chatRequest' });
        }
    }

    ChatMessage.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            chatRequestId: { type: DataTypes.UUID, allowNull: false },
            accountId: { type: DataTypes.UUID, allowNull: false },
            senderId: { type: DataTypes.STRING, allowNull: false },
            receiverId: { type: DataTypes.STRING, allowNull: false },
            message: { type: DataTypes.TEXT, allowNull: true },
            type: {
                type: DataTypes.ENUM('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'FILE', 'LOCATION'),
                defaultValue: 'TEXT',
            },
            attachmentUrl: { type: DataTypes.STRING, allowNull: true },
            status: {
                type: DataTypes.ENUM('SENT', 'DELIVERED', 'READ'),
                defaultValue: 'SENT',
            },
        },
        {
            sequelize,
            modelName: 'ChatMessage',
            tableName: 'chat_messages',
            paranoid: false,
            timestamps: true,
            updatedAt: false,
        }
    );

    return ChatMessage;
};
