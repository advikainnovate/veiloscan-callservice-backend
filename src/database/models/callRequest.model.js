const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CallRequest extends Model {
        static associate(models) {
            CallRequest.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
            CallRequest.belongsTo(models.AccountApiKey, { foreignKey: 'apiKeyId', as: 'apiKey' });
            CallRequest.hasMany(models.CallLog, { foreignKey: 'callRequestId', as: 'logs' });
        }
    }

    CallRequest.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            accountId: { type: DataTypes.UUID, allowNull: false },
            apiKeyId: { type: DataTypes.UUID, allowNull: false },
            roomId: { type: DataTypes.STRING, allowNull: true },
            callerId: { type: DataTypes.STRING, allowNull: true },
            receiverId: { type: DataTypes.STRING, allowNull: true },
            callerName: { type: DataTypes.STRING, allowNull: true },
            receiverName: { type: DataTypes.STRING, allowNull: true },
            callerPhone: { type: DataTypes.STRING, allowNull: true },
            receiverPhone: { type: DataTypes.STRING, allowNull: true },
            requestedAt: { type: DataTypes.DATE, allowNull: false },
            acceptedAt: { type: DataTypes.DATE, allowNull: true },
            metadata: { type: DataTypes.JSON, allowNull: true },
            status: {
                type: DataTypes.ENUM('PENDING', 'RINGING', 'ACCEPTED', 'DECLINED', 'MISSED', 'FAILED', 'ENDED'),
                defaultValue: 'PENDING',
            },
            deletedAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: 'CallRequest',
            tableName: 'call_requests',
            paranoid: true,
            timestamps: true,
        }
    );

    return CallRequest;
};
