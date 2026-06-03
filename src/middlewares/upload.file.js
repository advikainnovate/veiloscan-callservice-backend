const multer = require('multer');
const { logger } = require('../utils');
const { MESSAGES } = require('../config');
const { BadRequestException } = require('../helpers/errorResponse');
const path = require('path');
const fs = require('fs');

const allowedFileFormats = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    // 'image/bmp',
    // 'image/tiff',
    'image/webp',
    // 'image/svg+xml',
    // 'image/heic', // Mac & iOS HEIC
    // 'image/heif', // Mac & iOS HEIF

    // // Videos
    // 'video/mp4',
    // 'video/x-msvideo', // AVI
    // 'video/quicktime', // MOV
    // 'video/x-ms-wmv', // WMV
    // 'video/webm',
    // 'video/mpeg',
    // 'video/ogg',
    // 'video/3gpp',
    // 'video/x-flv',
    // 'video/hevc', // HEVC for Apple devices
    // 'video/x-m4v', // M4V for Mac

    // Documents
    'application/pdf',
    'application/msword',
    // 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // 'text/plain',
];

const fileFilter = (req, file, cb) => {
    logger.info(`file.mimetype ${file.mimetype}`);
    if (allowedFileFormats.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new BadRequestException(`${MESSAGES.INVALID_FILE_FORMAT}: ${file.mimetype} is not supported`), false);
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userId = req.user && req.user.id ? req.user.id : `anonymous-${Math.round(Math.random() * 1e10)}`;
        const year = new Date().getFullYear();
        const uploadPath = path.join('uploads', year.toString(), userId);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        // Sanitize original name to remove potentially dangerous characters or schemes like blob:
        const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const extension = path.extname(sanitizedOriginalName) || path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    },
});

module.exports = {
    uploadSingle: multer({ storage: storage, fileFilter }).single('file'),
};
