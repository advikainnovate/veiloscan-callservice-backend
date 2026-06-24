const express = require('express');
const router = express.Router();

const callRoutes = require('../modules/calls/call.routes');
const chatSessionRoutes = require('../modules/chats/chat.routes');
const organizationRoutes = require('../modules/organizations/organization.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const { apiKeyAuth } = require('../middlewares');
const { trackCallRequest, trackChatRequest } = require('../middlewares/tracking');

router.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Service is healthy', timestamp: new Date().toISOString() });
});

// Protect signaling and chat session HTTP endpoints with API key auth
router.use('/calls', apiKeyAuth, trackCallRequest, callRoutes);
router.use('/chat-sessions', apiKeyAuth, trackChatRequest, chatSessionRoutes);
router.use('/organizations', organizationRoutes);

// Admin — JWT protected (see admin.routes.js)
router.use('/admin', adminRoutes);

module.exports = router;
