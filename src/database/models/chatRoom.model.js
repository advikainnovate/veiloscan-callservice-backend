const {
    DataTypes
} = require("sequelize");

module.exports = (
    sequelize
) => {

    const ChatRoom =
        sequelize.define(
            "ChatRoom",
            {
                id: {
                    type:
                        DataTypes.UUID,
                    defaultValue:
                        DataTypes.UUIDV4,
                    primaryKey: true
                },

                roomName: {
                    type:
                        DataTypes.STRING,
                    allowNull: true
                },

                organizationId: {
                    type:
                        DataTypes.STRING,
                    allowNull: true
                }
            },
            {
                tableName:
                    "chat_rooms",
                timestamps: true
            }
        );

    return ChatRoom;
};