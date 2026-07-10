const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CallLog extends Model {
        static associate(models) {
            CallLog.belongsTo(models.Account, { foreignKey: 'accountId', as: 'account' });
            CallLog.belongsTo(models.CallRequest, { foreignKey: 'callRequestId', as: 'callRequest' });
        }
    }

    CallLog.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            accountId: { type: DataTypes.UUID, allowNull: false },
            callRequestId: { type: DataTypes.UUID, allowNull: false },
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
            modelName: 'CallLog',
            tableName: 'call_logs',
            paranoid: true,
            timestamps: true,
        }
    );

    return CallLog;
};
