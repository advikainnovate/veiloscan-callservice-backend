const chatRepository = require('../../repository/chat.repository');

const createRoom = async (data) => {
    return chatRepository.createRoom(data);
};

const saveMessage = async (data) => {
    return chatRepository.saveMessage(data);
};

const getMessages = async (roomId) => {
    return chatRepository.getMessages(roomId);
};

module.exports = {
    createRoom,
    saveMessage,
    getMessages,
};
