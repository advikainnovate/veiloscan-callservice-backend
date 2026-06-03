const express = require('express');
const router = express.Router();

const qrCodeController = require('./qrCode.controller');
const { CONSTANTS } = require('../../config');
const { validateAccessToken, validationMiddleware } = require('../../middlewares');
const { qrCodeSchema } = require('./qrCode.validation');

const adminAuth = validateAccessToken([CONSTANTS.ROLE.ADMIN, CONSTANTS.ROLE.SUPER_ADMIN]);

router.post('/create', adminAuth, qrCodeController.createQRCode);
router.post('/batch/create', adminAuth, validationMiddleware(qrCodeSchema.createBatch), qrCodeController.createQRCodeBatch);
router.post('/claim', adminAuth, validationMiddleware(qrCodeSchema.claim), qrCodeController.claimQRCode);
router.post('/:qrCodeId/assign', adminAuth, validationMiddleware(qrCodeSchema.assign), qrCodeController.assignQRCode);
router.post('/scan', validationMiddleware(qrCodeSchema.scan), qrCodeController.scanQRCode);
router.get('/my-codes', adminAuth, qrCodeController.getMyQRCodes);
router.get('/unassigned', adminAuth, validationMiddleware(qrCodeSchema.getUnassigned), qrCodeController.getUnassignedQRCodes);
router.get('/image/:token', qrCodeController.getQRCodeImage);
router.get('/resolve/:token', qrCodeController.handleQRScan);
router.patch('/:qrCodeId/revoke', adminAuth, qrCodeController.revokeQRCode);
router.patch('/:qrCodeId/disable', adminAuth, qrCodeController.disableQRCode);
router.patch('/:qrCodeId/reactivate', adminAuth, qrCodeController.reactivateQRCode);

module.exports = router;
