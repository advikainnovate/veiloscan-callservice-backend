const chatRepository = require('../../repository/chat.repository');

const createRoom = async (data) => {
    return chatRepository.createRoom(data);
};

const getRoom = async (roomId) => {
    return chatRepository.getRoom(roomId);
};

const updateRoomStatus = async (roomId, status) => {
    return chatRepository.updateRoomStatus(roomId, status);
};

const saveMessage = async (data) => {
    return chatRepository.saveMessage(data);
};

const getMessages = async (roomId, options = {}) => {
    return chatRepository.getMessages(roomId, options);
};

const markDelivered = async (messageId) => {
    return chatRepository.markDelivered(messageId);
};

const markRead = async (messageId) => {
    return chatRepository.markRead(messageId);
};

const markRoomMessagesRead = async (roomId, userId) => {
    return chatRepository.markRoomMessagesRead(roomId, userId);
};

module.exports = {
    createRoom,
    getRoom,
    updateRoomStatus,
    saveMessage,
    getMessages,
    markDelivered,
    markRead,
    markRoomMessagesRead,
};
