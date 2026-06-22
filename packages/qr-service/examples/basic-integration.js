/**
 * Example: Using QR Service in Your App
 *
 * This example shows how to integrate the modular QR Service into your backend application.
 */

const express = require('express');
const { QRService, SequelizeQRAdapter, createQRRouter } = require('../src'); // References the local packages/qr-service/src directory
const db = require('../../../src/database/models');

const app = express();

// Initialize QR Service with Sequelize adapter
const qrService = new QRService(new SequelizeQRAdapter(db));

// Create router with auth middleware placeholder
const qrRouter = createQRRouter(qrService, {
    authMiddleware: (req, res, next) => next(), // Replace with custom authentication middleware
});

// Mount on your API
app.use('/api/qr', qrRouter);

module.exports = app;
