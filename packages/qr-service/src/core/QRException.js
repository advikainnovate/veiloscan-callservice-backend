/**
 * Base exception for QR service errors
 */
class QRException extends Error {
  constructor(message, code = 'QR_ERROR', statusCode = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Thrown when validation fails
 */
class QRValidationException extends QRException {
  constructor(message, details = null) {
    super(message, 'QR_VALIDATION_ERROR', 400);
    this.details = details;
  }
}

/**
 * Thrown when resource is not found
 */
class QRNotFoundException extends QRException {
  constructor(message) {
    super(message, 'QR_NOT_FOUND', 404);
  }
}

/**
 * Thrown when operation is not allowed
 */
class QRConflictException extends QRException {
  constructor(message) {
    super(message, 'QR_CONFLICT', 409);
  }
}

/**
 * Thrown when unauthorized
 */
class QRUnauthorizedException extends QRException {
  constructor(message) {
    super(message, 'QR_UNAUTHORIZED', 403);
  }
}

module.exports = {
  QRException,
  QRValidationException,
  QRNotFoundException,
  QRConflictException,
  QRUnauthorizedException,
};
