const { errorResponse, successResponse } = require('../../helpers');
const qrCodeService = require('./qrCode.service');

const sendServiceResponse = (res, response) => {
    if (!response.success) {
        return errorResponse(res, response.code, response.message, response.data);
    }
    return successResponse(res, response.code, response.message, response.data);
};

exports.createQRCode = async (req, res, next) => {
    try {
        const response = await qrCodeService.createQRCode();
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.createQRCodeBatch = async (req, res, next) => {
    try {
        const response = await qrCodeService.createQRCodeBatch({
            ...req.body,
            createdBy: req.user?.id || req.body.createdBy,
        });
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.claimQRCode = async (req, res, next) => {
    try {
        const response = await qrCodeService.claimQRCode(req.user.id, req.body.token, req.body.humanToken);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.assignQRCode = async (req, res, next) => {
    try {
        const response = await qrCodeService.assignQRCode(req.params.qrCodeId, req.body.userId);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.scanQRCode = async (req, res, next) => {
    try {
        const response = await qrCodeService.scanQRCode(req.body.token, req.body.humanToken);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getMyQRCodes = async (req, res, next) => {
    try {
        const response = await qrCodeService.getUserQRCodes(req.user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getUnassignedQRCodes = async (req, res, next) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
        const response = await qrCodeService.getUnassignedQRCodes(limit, req.query.cursor);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.revokeQRCode = async (req, res, next) => {
    try {
        const response = await qrCodeService.revokeQRCode(req.params.qrCodeId, req.user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.disableQRCode = async (req, res, next) => {
    try {
        const response = await qrCodeService.disableQRCode(req.params.qrCodeId, req.user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.reactivateQRCode = async (req, res, next) => {
    try {
        const response = await qrCodeService.reactivateQRCode(req.params.qrCodeId, req.user.id);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};

exports.getQRCodeImage = async (req, res, next) => {
    try {
        const dataUrl = await qrCodeService.generateQRCodeImage(req.params.token);
        const buffer = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Cache-Control', 'public, max-age=31536000');
        return res.send(buffer);
    } catch (error) {
        next(error);
    }
};

exports.handleQRScan = async (req, res, next) => {
    try {
        const response = await qrCodeService.scanQRCode(req.params.token);
        return sendServiceResponse(res, response);
    } catch (error) {
        next(error);
    }
};
