const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CallSessionModel extends Model {
        static associate(models) {
            CallSessionModel.belongsTo(models.UserModel, {
                as: 'caller',
                foreignKey: 'callerId',
            });
            CallSessionModel.belongsTo(models.UserModel, {
                as: 'receiver',
                foreignKey: 'receiverId',
            });
        }
    }

    CallSessionModel.init(
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                allowNull: false,
                primaryKey: true,
            },
            callerId: { type: DataTypes.UUID, allowNull: true },
            receiverId: { type: DataTypes.UUID, allowNull: false },
            qrId: { type: DataTypes.UUID, allowNull: false },
            guestId: { type: DataTypes.STRING(100), allowNull: true },
            guestIp: { type: DataTypes.STRING(50), allowNull: true },
            callerType: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'registered',
            },
            status: {
                type: DataTypes.STRING(20),
                allowNull: false,
                defaultValue: 'initiated',
            },
            endedReason: { type: DataTypes.STRING(50), allowNull: true },
            initiatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
            startedAt: { type: DataTypes.DATE, allowNull: true },
            endedAt: { type: DataTypes.DATE, allowNull: true },
        },
        {
            sequelize,
            modelName: CallSessionModel.name,
            tableName: 'call_sessions',
            timestamps: true,
        }
    );

    return CallSessionModel;
};
