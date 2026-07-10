const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ChatRequest extends Model {
        static associate(models) {
            ChatRequest.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
            ChatRequest.belongsTo(models.AccountApiKey, { foreignKey: 'apiKeyId', as: 'apiKey' });
            ChatRequest.hasMany(models.ChatMessage, { foreignKey: 'chatRequestId', as: 'messages' });
        }
    }

    ChatRequest.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            accountId: { type: DataTypes.UUID, allowNull: false },
            apiKeyId: { type: DataTypes.UUID, allowNull: false },
            senderId: { type: DataTypes.STRING, allowNull: false },
            receiverId: { type: DataTypes.STRING, allowNull: false },
            senderName: { type: DataTypes.STRING, allowNull: true },
            receiverName: { type: DataTypes.STRING, allowNull: true },
            status: {
                type: DataTypes.ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CLOSED'),
                defaultValue: 'PENDING',
            },
        },
        {
            sequelize,
            modelName: 'ChatRequest',
            tableName: 'chat_requests',
            paranoid: false,
            timestamps: true,
        }
    );

    return ChatRequest;
};
