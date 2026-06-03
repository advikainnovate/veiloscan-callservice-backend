// Example: Error Handling with QR Service

const {
  QRService,
  SequelizeQRAdapter,
  QRValidationException,
  QRNotFoundException,
  QRConflictException,
  QRUnauthorizedException,
} = require('@your-org/qr-service');

const db = require('./database/models');
const qrService = new QRService(new SequelizeQRAdapter(db));

/**
 * Example Express error handler
 */
const qrErrorHandler = (error, req, res, next) => {
  // QR Service specific errors
  if (error instanceof QRValidationException) {
    return res.status(400).json({
      success: false,
      error: 'Validation Failed',
      message: error.message,
      details: error.details,
      code: error.code,
    });
  }

  if (error instanceof QRNotFoundException) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof QRConflictException) {
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof QRUnauthorizedException) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: error.message,
      code: error.code,
    });
  }

  // Generic error
  console.error('Unexpected error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  });
};

/**
 * Example usage in controller
 */
async function handleClaimQRCode(req, res, next) {
  try {
    const { token, humanToken } = req.body;
    const result = await qrService.claimQRCode(req.user.id, token, humanToken);

    res.json({
      success: true,
      message: result.message,
      data: result.data,
    });
  } catch (error) {
    next(error); // Pass to error handler
  }
}

/**
 * Example programmatic error handling
 */
async function claimQRCodeWithRetry(userId, token, maxRetries = 3) {
  let lastError = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await qrService.claimQRCode(userId, token);
      return result;
    } catch (error) {
      lastError = error;

      if (error instanceof QRNotFoundException) {
        // Don't retry - QR code doesn't exist
        throw error;
      }

      if (error instanceof QRConflictException) {
        // Don't retry - QR code already claimed
        throw error;
      }

      if (error instanceof QRValidationException) {
        // Don't retry - validation error
        throw error;
      }

      // For other errors, retry
      if (attempt < maxRetries) {
        console.warn(`Attempt ${attempt} failed, retrying...`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s
      }
    }
  }

  throw lastError;
}

/**
 * Example: Batch creation with error handling
 */
async function createBatchSafely(batchConfig) {
  try {
    const result = await qrService.createQRCodeBatch(batchConfig);
    console.log(`Created batch: ${result.data.batch.batchNumber}`);
    return result.data;
  } catch (error) {
    if (error instanceof QRValidationException) {
      console.error('Invalid batch configuration:', error.details);
      // Return user-friendly error
      return {
        success: false,
        error: 'Invalid configuration',
        message: `Allowed counts are: ${error.details.allowed.join(', ')}`,
      };
    }

    throw error; // Re-throw unexpected errors
  }
}

module.exports = {
  qrErrorHandler,
  handleClaimQRCode,
  claimQRCodeWithRetry,
  createBatchSafely,
};
