const express = require('express');
const router = express.Router();

const userRoutes = require('../modules/users/user.routes');
const callRoutes = require('../modules/calls/call.routes');
const qrCodeRoutes = require('../modules/qrCodes/qrCode.routes');
const chatSessionRoutes = require('../modules/chatSessions/chatSession.routes');

router.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Service is healthy', timestamp: new Date().toISOString() });
});

router.use('/users', userRoutes);
router.use('/calls', callRoutes);
router.use('/qr-codes', qrCodeRoutes);
router.use('/chat-sessions', chatSessionRoutes);

module.exports = router;
