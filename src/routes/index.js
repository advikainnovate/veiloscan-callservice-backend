const express = require('express');
const router = express.Router();

const callRoutes = require('../modules/calls/call.routes');
const chatSessionRoutes = require('../modules/chats/chat.routes');
const organizationRoutes = require('../modules/organizations/organization.routes');
const adminRoutes = require('../modules/admin/admin.routes');
const { apiKeyAuth } = require('../middlewares');

router.get('/healthz', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Service is healthy', timestamp: new Date().toISOString() });
});

// Protect call and chat HTTP endpoints with API key auth
// Note: usage counts (callRequestsCount / chatRequestsCount) are incremented by
// the socket handlers on join-session / join-room — not here — to avoid double-counting.
router.use('/calls', apiKeyAuth, callRoutes);
router.use('/chat-sessions', apiKeyAuth, chatSessionRoutes);
router.use('/organizations', organizationRoutes);

// Admin — JWT protected (see admin.routes.js)
router.use('/admin', adminRoutes);

module.exports = router;
