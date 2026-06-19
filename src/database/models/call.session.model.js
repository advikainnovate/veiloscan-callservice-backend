const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class CallSessionModel extends Model {
        static associate(model) {}
    }

    CallSessionModel.init(
        {
            id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, allowNull: false, primaryKey: true },
            sessionId: { type: DataTypes.UUID, allowNull: false, unique: true },
            clientId: { type: DataTypes.STRING, allowNull: false },
            status: { type: DataTypes.ENUM('created', 'active', 'paused', 'ended'), defaultValue: 'created' },
            startedAt: { type: DataTypes.DATE, allowNull: true },
            endedAt: { type: DataTypes.DATE, allowNull: true },
            durationSeconds: { type: DataTypes.INTEGER, allowNull: true },
        },
        {
            sequelize,
            modelName: 'CallSession',
            tableName: 'call_sessions',
            paranoid: false,
            timestamps: true,
        }
    );

    return CallSessionModel;
};
