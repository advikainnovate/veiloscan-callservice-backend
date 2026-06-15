const {
    DataTypes
} = require("sequelize");

module.exports = (
    sequelize
) => {

    const ChatMessage =
        sequelize.define(
            "ChatMessage",
            {
                id: {
                    type:
                        DataTypes.UUID,
                    defaultValue:
                        DataTypes.UUIDV4,
                    primaryKey: true
                },

                roomId: {
                    type:
                        DataTypes.STRING,
                    allowNull: false
                },

                senderId: {
                    type:
                        DataTypes.STRING,
                    allowNull: false
                },

                receiverId: {
                    type:
                        DataTypes.STRING,
                    allowNull: true
                },

                message: {
                    type:
                        DataTypes.TEXT,
                    allowNull: false
                },

                messageType: {
                    type:
                        DataTypes.ENUM(
                            "text",
                            "image",
                            "file"
                        ),
                    defaultValue:
                        "text"
                },

                deliveredAt: {
                    type:
                        DataTypes.DATE,
                    allowNull: true
                },

                readAt: {
                    type:
                        DataTypes.DATE,
                    allowNull: true
                }
            },
            {
                tableName:
                    "chat_messages",
                timestamps: true
            }
        );

    return ChatMessage;
};