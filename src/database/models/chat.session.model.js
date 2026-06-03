const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class ChatSessionModel extends Model {
        static associate(models) {
            ChatSessionModel.belongsTo(models.QrCodeModel, {
                as: 'qrCode',
                foreignKey: 'qrId',
            });
            ChatSessionModel.belongsTo(models.UserModel, {
                as: 'participant1',
                foreignKey: 'participant1Id',
            });
            ChatSessionModel.belongsTo(models.UserModel, {
                as: 'participant2',
                foreignKey: 'participant2Id',
            });
        }
    }

    ChatSessionModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            qrId: { type: DataTypes.UUID, allowNull: false },
            participant1Id: { type: DataTypes.UUID, allowNull: false },
            participant2Id: { type: DataTypes.UUID, allowNull: false },
            status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'active',
            },
            startedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            endedAt: { type: DataTypes.DATE, allowNull: true },
            lastMessageAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: ChatSessionModel.name,
            tableName: 'chat_sessions',
            timestamps: true,
            updatedAt: false,
        }
    );

    return ChatSessionModel;
};
