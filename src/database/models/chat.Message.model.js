const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ChatMessageModel extends Model {
        static associate(models) {
            ChatMessageModel.belongsTo(models.ChatRoom, {
                foreignKey: 'roomId',
                as: 'room',
            });
        }
    }

    ChatMessageModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            roomId: { type: DataTypes.STRING, allowNull: false },
            senderId: { type: DataTypes.STRING, allowNull: false },
            receiverId: { type: DataTypes.STRING, allowNull: true },
            message: { type: DataTypes.TEXT, allowNull: false },
            messageType: { type: DataTypes.ENUM('text', 'image', 'file'), defaultValue: 'text' },
            status: {
                type: DataTypes.ENUM('sending', 'sent', 'delivered', 'read', 'failed'),
                defaultValue: 'sent',
            },
            deliveredAt: { type: DataTypes.DATE, allowNull: true },
            readAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: 'ChatMessage',
            tableName: 'chat_messages',
            paranoid: false,
            timestamps: true,
        }
    );

    return ChatMessageModel;
};
