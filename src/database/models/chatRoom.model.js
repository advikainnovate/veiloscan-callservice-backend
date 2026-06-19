const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ChatRoomModel extends Model {
        static associate(models) {
            ChatRoomModel.hasMany(models.ChatMessage, {
                foreignKey: 'roomId',
                as: 'messages',
            });
        }
    }

    ChatRoomModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            roomName: { type: DataTypes.STRING, allowNull: true },
            organizationId: { type: DataTypes.STRING, allowNull: true },
        },
        {
            sequelize,
            modelName: 'ChatRoom',
            tableName: 'chat_rooms',
            paranoid: false,
            timestamps: true,
        }
    );

    return ChatRoomModel;
};
