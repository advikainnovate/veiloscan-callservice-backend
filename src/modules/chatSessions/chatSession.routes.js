const express = require('express');
const router = express.Router();

const chatSessionController = require('./chatSession.controller');
const { CONSTANTS } = require('../../config');
const { validateAccessToken, validationMiddleware } = require('../../middlewares');
const { chatSessionSchema } = require('./chatSession.validation');

const auth = validateAccessToken([CONSTANTS.ROLE.ADMIN, CONSTANTS.ROLE.SUPER_ADMIN]);

router.post('/initiate', auth, validationMiddleware(chatSessionSchema.initiate), chatSessionController.initiateChat);
router.get('/my-chats', auth, validationMiddleware(chatSessionSchema.list), chatSessionController.getMyChatSessions);
router.get('/my/all', auth, validationMiddleware(chatSessionSchema.list), chatSessionController.getMyChatSessions);
router.get('/active/list', auth, chatSessionController.getActiveChatSessions);
router.get('/:chatSessionId', auth, validationMiddleware(chatSessionSchema.params), chatSessionController.getChatSession);
router.patch('/:chatSessionId/end', auth, validationMiddleware(chatSessionSchema.params), chatSessionController.endChatSession);
router.patch('/:chatSessionId/block', auth, validationMiddleware(chatSessionSchema.params), chatSessionController.blockChatSession);

module.exports = router;
