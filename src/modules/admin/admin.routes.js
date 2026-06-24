const router = require('express').Router();
const controller = require('./admin.controller');
const { adminAuth } = require('../../middlewares/adminAuth');

// ── Auth (public) ─────────────────────────────────────────────────────────────
router.post('/login', controller.login);

// All routes below require a valid admin JWT
router.use(adminAuth);

// ── Dashboard ─────────────────────────────────────────────────────────────────
router.get('/overview',           controller.getOverview);
router.get('/usage',              controller.getUsageByOrg);
router.get('/api-keys/activity',  controller.getApiKeyActivity);

// ── Organizations ─────────────────────────────────────────────────────────────
router.get('/organizations',                          controller.listOrganizations);
router.get('/organizations/:id',                      controller.getOrganization);
router.patch('/organizations/:id/activate',           controller.activateOrganization);
router.patch('/organizations/:id/deactivate',         controller.deactivateOrganization);

// ── Call Analytics ────────────────────────────────────────────────────────────
router.get('/calls/stats',         controller.getCallStats);
router.get('/calls/over-time',     controller.getCallsOverTime);
router.get('/calls/recent',        controller.getRecentCalls);

// ── Chat Analytics ────────────────────────────────────────────────────────────
router.get('/chats/stats',         controller.getChatStats);
router.get('/chats/over-time',     controller.getMessagesOverTime);

module.exports = router;
