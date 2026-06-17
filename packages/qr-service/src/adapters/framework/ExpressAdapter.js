/**
 * Express Framework Integration
 * Provides controllers and route setup for Express.js
 */

/**
 * Create a middleware-friendly response handler
 */
const sendServiceResponse = (res, response) => {
    if (!response.success) {
        return res.status(response.statusCode || 500).json({
            success: false,
            code: response.code,
            message: response.message,
            data: response.data || null,
        });
    }

    const statusCode = response.statusCode || (response.message.includes('created') ? 201 : 200);
    return res.status(statusCode).json({
        success: true,
        message: response.message,
        data: response.data,
    });
};

/**
 * Error handler middleware wrapper
 */
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create Express controllers for QR Service
 */
const createQRControllers = (qrService) => ({
    createQRCode: asyncHandler(async (req, res) => {
        const response = await qrService.createQRCode();
        response.statusCode = 201;
        return sendServiceResponse(res, response);
    }),

    createQRCodeBatch: asyncHandler(async (req, res) => {
        const response = await qrService.createQRCodeBatch({
            ...req.body,
            createdBy: req.user?.id || req.body.createdBy,
        });
        response.statusCode = 201;
        return sendServiceResponse(res, response);
    }),

    claimQRCode: asyncHandler(async (req, res) => {
        const response = await qrService.claimQRCode(req.user.id, req.body.token, req.body.humanToken);
        return sendServiceResponse(res, response);
    }),

    assignQRCode: asyncHandler(async (req, res) => {
        const response = await qrService.assignQRCode(req.params.qrCodeId, req.body.userId);
        return sendServiceResponse(res, response);
    }),

    scanQRCode: asyncHandler(async (req, res) => {
        const response = await qrService.scanQRCode(req.body.token, req.body.humanToken);
        return sendServiceResponse(res, response);
    }),

    getMyQRCodes: asyncHandler(async (req, res) => {
        const response = await qrService.getUserQRCodes(req.user.id);
        return sendServiceResponse(res, response);
    }),

    getUnassignedQRCodes: asyncHandler(async (req, res) => {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const response = await qrService.getUnassignedQRCodes(limit, req.query.cursor);
        return sendServiceResponse(res, response);
    }),

    getQRCodeById: asyncHandler(async (req, res) => {
        const response = await qrService.getQRCodeById(req.params.qrCodeId);
        return sendServiceResponse(res, response);
    }),

    revokeQRCode: asyncHandler(async (req, res) => {
        const response = await qrService.revokeQRCode(req.params.qrCodeId, req.user.id);
        return sendServiceResponse(res, response);
    }),

    disableQRCode: asyncHandler(async (req, res) => {
        const response = await qrService.disableQRCode(req.params.qrCodeId, req.user.id);
        return sendServiceResponse(res, response);
    }),

    reactivateQRCode: asyncHandler(async (req, res) => {
        const response = await qrService.reactivateQRCode(req.params.qrCodeId, req.user.id);
        return sendServiceResponse(res, response);
    }),

    handleQRScan: asyncHandler(async (req, res) => {
        const response = await qrService.scanQRCode(req.params.token);
        if (response.data?.assignedUserId) {
            // Redirect to user profile or handle as needed
            return res.json({
                success: true,
                message: 'QR code resolved',
                data: response.data,
            });
        }
        return sendServiceResponse(res, response);
    }),
});

module.exports = {
    sendServiceResponse,
    asyncHandler,
    createQRControllers,
};
