const express = require('express');
const router = express.Router();

const callRoutes = require('../modules/calls/call.routes');
const chatSessionRoutes = require('../modules/chats/chat.routes');

router.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Service is healthy', timestamp: new Date().toISOString() });
});


router.use('/calls', callRoutes);
router.use('/chat-sessions', chatSessionRoutes);

module.exports = router;
