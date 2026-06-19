const chatService = require('./chat.service');

const createRoom = async (req, res) => {
    const room = await chatService.createRoom(req.body);

    res.status(201).json(room);
};

const getMessages = async (req, res) => {
    const messages = await chatService.getMessages(req.params.roomId);

    res.json(messages);
};

module.exports = {
    createRoom,
    getMessages,
};
