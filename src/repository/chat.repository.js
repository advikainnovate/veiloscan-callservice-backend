const { ChatRoom, ChatMessage } = require('../database/models');
const { Op } = require('sequelize');

// ── Rooms ─────────────────────────────────────────────────────────────────────

const createRoom = async (payload) => {
    return ChatRoom.create(payload);
};

const getRoom = async (roomId) => {
    return ChatRoom.findByPk(roomId);
};

const updateRoomStatus = async (roomId, status) => {
    await ChatRoom.update({ status }, { where: { id: roomId } });
    return getRoom(roomId);
};

// ── Messages ──────────────────────────────────────────────────────────────────

const saveMessage = async (payload) => {
    return ChatMessage.create({
        roomId:      payload.roomId,
        senderId:    payload.userId || payload.senderId,
        receiverId:  payload.receiverId || null,
        message:     payload.message || payload.text,
        messageType: payload.messageType || 'text',
        status:      'sent',
    });
};

const getMessages = async (roomId, { limit = 50, before = null } = {}) => {
    const where = { roomId };
    if (before) {
        where.createdAt = { [Op.lt]: before };
    }
    return ChatMessage.findAll({
        where,
        order: [['createdAt', 'ASC']],
        limit,
    });
};

const getMessageById = async (messageId) => {
    return ChatMessage.findByPk(messageId);
};

const markDelivered = async (messageId) => {
    await ChatMessage.update(
        { status: 'delivered', deliveredAt: new Date() },
        { where: { id: messageId } }
    );
    return getMessageById(messageId);
};

const markRead = async (messageId) => {
    await ChatMessage.update(
        { status: 'read', readAt: new Date() },
        { where: { id: messageId } }
    );
    return getMessageById(messageId);
};

const markRoomMessagesRead = async (roomId, receiverId) => {
    await ChatMessage.update(
        { status: 'read', readAt: new Date() },
        { where: { roomId, receiverId, status: { [Op.ne]: 'read' } } }
    );
};

const markFailed = async (messageId) => {
    return ChatMessage.update(
        { status: 'failed' },
        { where: { id: messageId } }
    );
};

module.exports = {
    createRoom,
    getRoom,
    updateRoomStatus,
    saveMessage,
    getMessages,
    getMessageById,
    markDelivered,
    markRead,
    markRoomMessagesRead,
    markFailed,
};
