const express = require('express');
const router = express.Router();
const controller = require('./chat.controller');

// ── Rooms ─────────────────────────────────────────────────────────────────────
router.post('/rooms', controller.createRoom);
router.get('/rooms/:roomId', controller.getRoom);
router.patch('/rooms/:roomId/status', controller.updateRoomStatus);

// ── Messages ──────────────────────────────────────────────────────────────────
router.get('/rooms/:roomId/messages', controller.getMessages);
router.patch('/messages/:messageId/delivered', controller.markDelivered);
router.patch('/messages/:messageId/read', controller.markRead);

module.exports = router;
