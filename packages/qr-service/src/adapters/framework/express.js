const express = require('express');
const { createQRControllers } = require('./ExpressAdapter');

/**
 * Create an Express router for QR Service
 * @param {QRService} qrService - Instance of QRService
 * @param {Object} options - Configuration
 * @param {Function} options.authMiddleware - Auth middleware to protect routes
 * @param {Function} options.validationMiddleware - Validation middleware factory
 * @returns {express.Router}
 */
const createQRRouter = (qrService, options = {}) => {
  const router = express.Router();
  const controllers = createQRControllers(qrService);

  const { authMiddleware, validationMiddleware } = options;

  // Routes without auth (public scan)
  router.post('/scan', controllers.scanQRCode);
  router.get('/resolve/:token', controllers.handleQRScan);

  // Routes with auth
  if (authMiddleware) {
    router.post('/create', authMiddleware, controllers.createQRCode);
    router.post('/batch/create', authMiddleware, controllers.createQRCodeBatch);
    router.post('/claim', authMiddleware, controllers.claimQRCode);
    router.post('/:qrCodeId/assign', authMiddleware, controllers.assignQRCode);
    router.get('/my-codes', authMiddleware, controllers.getMyQRCodes);
    router.get('/unassigned', authMiddleware, controllers.getUnassignedQRCodes);
    router.get('/:qrCodeId', authMiddleware, controllers.getQRCodeById);
    router.patch('/:qrCodeId/revoke', authMiddleware, controllers.revokeQRCode);
    router.patch('/:qrCodeId/disable', authMiddleware, controllers.disableQRCode);
    router.patch('/:qrCodeId/reactivate', authMiddleware, controllers.reactivateQRCode);
  } else {
    // Register all routes without auth protection if middleware not provided
    router.post('/create', controllers.createQRCode);
    router.post('/batch/create', controllers.createQRCodeBatch);
    router.post('/claim', controllers.claimQRCode);
    router.post('/:qrCodeId/assign', controllers.assignQRCode);
    router.get('/my-codes', controllers.getMyQRCodes);
    router.get('/unassigned', controllers.getUnassignedQRCodes);
    router.get('/:qrCodeId', controllers.getQRCodeById);
    router.patch('/:qrCodeId/revoke', controllers.revokeQRCode);
    router.patch('/:qrCodeId/disable', controllers.disableQRCode);
    router.patch('/:qrCodeId/reactivate', controllers.reactivateQRCode);
  }

  return router;
};

module.exports = {
  createQRRouter,
};
