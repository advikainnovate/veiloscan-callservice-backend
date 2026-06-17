const router = require('express').Router();

const controller = require('./call.controller');

router.post('/session', controller.createSession);

router.get('/session/:sessionId', controller.getSession);

router.post('/session/:sessionId/end', controller.endSession);

router.patch('/session/:sessionId/accept', controller.acceptSession);

router.patch('/session/:sessionId/reject', controller.rejectSession);

module.exports = router;
