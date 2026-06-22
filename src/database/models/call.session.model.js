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
            callerUserId: { type: DataTypes.STRING, allowNull: true },
            calleeUserId: { type: DataTypes.STRING, allowNull: true },
            status: {
                type: DataTypes.ENUM('idle', 'ringing', 'connecting', 'connected', 'paused', 'ended', 'failed'),
                defaultValue: 'idle',
            },
            hasVideo: { type: DataTypes.BOOLEAN, defaultValue: false },
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
