const express = require('express');
const router = express.Router();

const callController = require('./call.controller');
const { optionalAuth, validationMiddleware } = require('../../middlewares');
const { callSchema } = require('./call.validation');

router.post('/initiate', optionalAuth, validationMiddleware(callSchema.initiate), callController.initiateCall);
router.post('/initiate/from-chat', optionalAuth, validationMiddleware(callSchema.initiateFromChat), callController.initiateCallFromChat);
router.get('/history', optionalAuth, validationMiddleware(callSchema.actorQuery), callController.getCallHistory);
router.get('/active', optionalAuth, validationMiddleware(callSchema.actorQuery), callController.getActiveCalls);
router.get('/daily-count/:userId', callController.getDailyCallCount);
router.get('/:id/view', optionalAuth, callController.getCallSession);
router.get('/:id/duration', callController.getCallDuration);
router.patch('/:id/status', optionalAuth, validationMiddleware(callSchema.updateStatus), callController.updateCallStatus);
router.patch('/:id/ring', optionalAuth, validationMiddleware(callSchema.action), callController.ringCall);
router.patch('/:id/accept', optionalAuth, validationMiddleware(callSchema.action), callController.acceptCall);
router.patch('/:id/reject', optionalAuth, validationMiddleware(callSchema.action), callController.rejectCall);
router.patch('/:id/end', optionalAuth, validationMiddleware(callSchema.action), callController.endCall);

module.exports = router;
