const { ChatRoom, ChatMessage } = require('../database/models');

const createRoom = async (payload) => {
    return ChatRoom.create(payload);
};

const getRoom = async (roomId) => {
    return ChatRoom.findByPk(roomId);
};

const saveMessage = async (payload) => {
    const messagePayload = {
        roomId: payload.roomId,
        senderId: payload.userId,
        receiverId: payload.receiverId || null,
        message: payload.message || payload.text,
        messageType: payload.messageType || 'text',
    };

    return ChatMessage.create(messagePayload);
};

const getMessages = async (roomId) => {
    return ChatMessage.findAll({
        where: { roomId },
        order: [['createdAt', 'ASC']],
    });
};

const markDelivered = async (messageId) => {
    return ChatMessage.update(
        { deliveredAt: new Date() },
        { where: { id: messageId } }
    );
};

const markRead = async (messageId) => {
    return ChatMessage.update(
        { readAt: new Date() },
        { where: { id: messageId } }
    );
};

module.exports = {
    createRoom,
    getRoom,
    saveMessage,
    getMessages,
    markDelivered,
    markRead,
};
