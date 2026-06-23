const chatService = require('./chat.service');

const createRoom = async (req, res, next) => {
    try {
        const room = await chatService.createRoom(req.body);
        return res.status(201).json({ success: true, data: room });
    } catch (err) {
        next(err);
    }
};

const getRoom = async (req, res, next) => {
    try {
        const room = await chatService.getRoom(req.params.roomId);
        return res.json({ success: true, data: room });
    } catch (err) {
        next(err);
    }
};

const updateRoomStatus = async (req, res, next) => {
    try {
        const { status } = req.body;
        const room = await chatService.updateRoomStatus(req.params.roomId, status);
        return res.json({ success: true, data: room });
    } catch (err) {
        next(err);
    }
};

const getMessages = async (req, res, next) => {
    try {
        const { limit, before } = req.query;
        const messages = await chatService.getMessages(req.params.roomId, {
            limit: limit ? parseInt(limit) : 50,
            before: before || null,
        });
        return res.json({ success: true, data: messages });
    } catch (err) {
        next(err);
    }
};

const markDelivered = async (req, res, next) => {
    try {
        const message = await chatService.markDelivered(req.params.messageId);
        return res.json({ success: true, data: message });
    } catch (err) {
        next(err);
    }
};

const markRead = async (req, res, next) => {
    try {
        const message = await chatService.markRead(req.params.messageId);
        return res.json({ success: true, data: message });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    createRoom,
    getRoom,
    updateRoomStatus,
    getMessages,
    markDelivered,
    markRead,
};
