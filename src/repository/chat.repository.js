const { ChatRoom, ChatMessage } = require('../database/models');

module.exports = {
    async createRoom(payload) {
        return ChatRoom.create(payload);
    },

    async getRoom(roomId) {
        return ChatRoom.findByPk(roomId);
    },

    async saveMessage(payload) {
        const messagePayload = {
            roomId: payload.roomId,
            senderId: payload.userId,
            receiverId: payload.receiverId || null,
            message: payload.message || payload.text,
            messageType: payload.messageType || 'text',
        };

        return ChatMessage.create(messagePayload);
    },

    async getMessages(roomId) {
        return ChatMessage.findAll({
            where: {
                roomId,
            },

            order: [['createdAt', 'ASC']],
        });
    },

    async markDelivered(messageId) {
        return ChatMessage.update(
            {
                deliveredAt: new Date(),
            },
            {
                where: {
                    id: messageId,
                },
            }
        );
    },

    async markRead(messageId) {
        return ChatMessage.update(
            {
                readAt: new Date(),
            },
            {
                where: {
                    id: messageId,
                },
            }
        );
    },
};
