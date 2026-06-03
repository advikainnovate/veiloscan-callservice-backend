// Core service
const {
  QRService,
  QRTokenService,
  QRException,
  QRValidationException,
  QRNotFoundException,
  QRConflictException,
  QRUnauthorizedException,
} = require('./core');

// Database adapters
const {
  IQRDatabaseAdapter,
  SequelizeQRAdapter,
} = require('./adapters/database');

// Framework adapters
const {
  createQRRouter,
  createQRControllers,
  sendServiceResponse,
  asyncHandler,
} = require('./adapters/framework');

module.exports = {
  // Core
  QRService,
  QRTokenService,
  QRException,
  QRValidationException,
  QRNotFoundException,
  QRConflictException,
  QRUnauthorizedException,

  // Database adapters
  IQRDatabaseAdapter,
  SequelizeQRAdapter,

  // Framework adapters
  createQRRouter,
  createQRControllers,
  sendServiceResponse,
  asyncHandler,
};
