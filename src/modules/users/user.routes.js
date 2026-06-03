const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { validateAccessToken, validationMiddleware } = require('../../middlewares');
const { CONSTANTS } = require('../../config');
const { userSchema } = require('./user.validation');

const adminAuth = validateAccessToken([CONSTANTS.ROLE.ADMIN, CONSTANTS.ROLE.SUPER_ADMIN]);

router.post('/register', validationMiddleware(userSchema.register), userController.register);
router.post('/login', validationMiddleware(userSchema.login), userController.login);
router.post('/create', adminAuth, validationMiddleware(userSchema.create), userController.createUser);

router.get('/dashboard', adminAuth, userController.getDashboard);
router.get('/profile', validateAccessToken(), userController.profile);
router.get('/all', adminAuth, userController.getAllUsers);
router.get('/all/dropdown', adminAuth, userController.getAllUserDropdown);
router.get('/:id/view', adminAuth, userController.findUser);
router.put(
    '/:id/changePassword',
    // validateAccessToken([CONSTANTS.ROLE.ADMIN]),
    validationMiddleware(userSchema.changePassword),
    userController.changePassword
);

router.post(
    '/check/displayName',
    adminAuth,
    validationMiddleware(userSchema.findDisplayName),
    userController.checkDisplayName
);
router.patch(
    '/:id/update',
    adminAuth,
    validationMiddleware(userSchema.update),
    userController.updateUser
);

router.patch(
    '/:id/updateStatus',
    adminAuth,
    validationMiddleware(userSchema.updateStatus),
    userController.updateUser
);

router.delete('/:id/delete', adminAuth, userController.deleteUser);

module.exports = router;
