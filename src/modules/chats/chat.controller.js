const chatService = require('./chat.service');

module.exports = {
    async createRoom(req, res) {
        const room = await chatService.createRoom(req.body);

        res.status(201).json(room);
    },

    async getMessages(req, res) {
        const messages = await chatService.getMessages(req.params.roomId);

        res.json(messages);
    },
};
