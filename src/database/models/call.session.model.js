module.exports = (sequelize, DataTypes) => {
    const CallSession = sequelize.define(
        "CallSession",
        {
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true
            },

            sessionId: {
                type: DataTypes.UUID,
                allowNull: false,
                unique: true
            },

            clientId: {
                type: DataTypes.STRING,
                allowNull: false
            },

            status: {
                type: DataTypes.ENUM(
                    "created",
                    "active",
                    "ended"
                ),
                defaultValue: "created"
            },

            startedAt: {
                type: DataTypes.DATE
            },

            endedAt: {
                type: DataTypes.DATE
            },

            durationSeconds: {
                type: DataTypes.INTEGER
            }
        },
        {
            tableName: "call_sessions",
            timestamps: true
        }
    );

    return CallSession;
};