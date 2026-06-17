const chatRepository = require('../../repository/chat.repository');

module.exports = {
    async createRoom(data) {
        return chatRepository.createRoom(data);
    },

    async saveMessage(data) {
        return chatRepository.saveMessage(data);
    },

    async getMessages(roomId) {
        return chatRepository.getMessages(roomId);
    },
};
