# QR Service Integration Guide

This guide shows how to integrate the `@your-org/qr-service` package into your application.

## Installation

### In the same monorepo

```bash
npm install ../packages/qr-service
# or use npm workspaces if configured
```

### As published npm package

```bash
npm install @your-org/qr-service
```

## Quick Start

### 1. Initialize the Service

```javascript
const { QRService, SequelizeQRAdapter } = require('@your-org/qr-service');
const db = require('./database/models'); // Your Sequelize models

// Initialize the service with your database
const qrService = new QRService(new SequelizeQRAdapter(db));
```

### 2. Express Integration

```javascript
const express = require('express');
const { createQRRouter } = require('@your-org/qr-service');

const app = express();

// Create router with optional auth middleware
const qrRouter = createQRRouter(qrService, {
  authMiddleware: validateAccessToken(['admin']),
  validationMiddleware: validationMiddleware, // optional
});

// Mount router
app.use('/api/qr', qrRouter);
```

## Usage Examples

### Create a QR Code

```javascript
const result = await qrService.createQRCode();
console.log(result.data); // { id, token, humanToken, status, ... }
```

### Create a Batch

```javascript
const result = await qrService.createQRCodeBatch({
  count: 100,
  purpose: 'printing', // or 'digital'
  createdBy: 'user-id',
  notes: 'First batch',
  printJobRef: 'JOB-001'
});

console.log(result.data.batch); // Batch info
console.log(result.data.qrCodes); // Array of 100 QR codes
```

### Claim a QR Code

```javascript
const result = await qrService.claimQRCode(
  userId,
  token, // secure token OR
  humanToken // human-readable token
);
```

### Scan/Resolve a QR Code

```javascript
const result = await qrService.scanQRCode(token);
console.log(result.data); // QR code details
```

### Get User's QR Codes

```javascript
const result = await qrService.getUserQRCodes(userId);
console.log(result.data); // Array of QR codes
```

### Get Unassigned QR Codes (with pagination)

```javascript
const result = await qrService.getUnassignedQRCodes(limit = 50, cursor = null);
console.log(result.data.qrCodes); // QR codes
console.log(result.data.cursor); // Next page cursor
console.log(result.data.hasMore); // Has more pages
```

### Revoke/Disable/Reactivate

```javascript
// Revoke a QR code permanently
await qrService.revokeQRCode(qrCodeId, requestedBy);

// Disable temporarily
await qrService.disableQRCode(qrCodeId, requestedBy);

// Reactivate a disabled code
await qrService.reactivateQRCode(qrCodeId, requestedBy);
```

## Error Handling

The service throws specific exceptions:

```javascript
const {
  QRValidationException,
  QRNotFoundException,
  QRConflictException,
  QRUnauthorizedException,
} = require('@your-org/qr-service');

try {
  await qrService.claimQRCode(userId, token);
} catch (error) {
  if (error instanceof QRValidationException) {
    // Handle validation error
    console.log(error.statusCode); // 400
  } else if (error instanceof QRNotFoundException) {
    // Handle not found
    console.log(error.statusCode); // 404
  } else if (error instanceof QRConflictException) {
    // Handle conflict
    console.log(error.statusCode); // 409
  }
}
```

## Creating Custom Database Adapters

Implement the `IQRDatabaseAdapter` interface:

```javascript
const { IQRDatabaseAdapter } = require('@your-org/qr-service');

class MongoDBAdapter extends IQRDatabaseAdapter {
  constructor(mongoDbClient) {
    super();
    this.db = mongoDbClient;
  }

  async createQRCode(payload) {
    return this.db.collection('qr_codes').insertOne(payload);
  }

  async findQRCodeById(id) {
    return this.db.collection('qr_codes').findOne({ _id: id });
  }

  // ... implement all other methods
}

// Use with service
const qrService = new QRService(new MongoDBAdapter(mongoClient));
```

## Response Format

All service methods return a consistent response object:

```javascript
{
  success: boolean,
  message: string,
  data: any,
  statusCode?: number,
  code?: string
}
```

When used with Express, the `sendServiceResponse` middleware automatically:
- Sets the correct HTTP status code
- Formats JSON response
- Handles errors

## Advanced: Custom Framework Integration

To integrate with a different framework (e.g., Fastify, Hapi), create adapters:

```javascript
const createFastifyPlugin = (qrService) => {
  return {
    plugin: async (fastify) => {
      fastify.post('/qr/create', async (request) => {
        const result = await qrService.createQRCode();
        return result.data;
      });

      // ... register other routes
    }
  };
};

// Use in Fastify
fastify.register(createFastifyPlugin(qrService));
```

## API Endpoints (with Express Router)

When using the Express router, these endpoints are available:

```
POST   /scan                    - Scan/resolve a QR code (public)
GET    /resolve/:token         - Resolve QR code (public)
POST   /create                 - Create single QR code (admin)
POST   /batch/create           - Create QR batch (admin)
POST   /claim                  - Claim QR code for user (admin)
POST   /:qrCodeId/assign       - Assign QR code to user (admin)
GET    /my-codes               - Get user's QR codes (admin)
GET    /unassigned             - Get unassigned codes (admin)
GET    /:qrCodeId              - Get specific QR code (admin)
PATCH  /:qrCodeId/revoke       - Revoke QR code (admin)
PATCH  /:qrCodeId/disable      - Disable QR code (admin)
PATCH  /:qrCodeId/reactivate   - Reactivate QR code (admin)
```

## Database Schema Requirements

The Sequelize adapter expects these models:

### QrCodeModel
```javascript
{
  id: UUID,
  token: String (64 hex chars),
  humanToken: String (e.g., QR-XXXX-XXXX),
  batchId: UUID,
  assignedUserId: UUID,
  status: Enum('unassigned', 'active', 'disabled', 'revoked'),
  assignedAt: DateTime,
  disabledAt: DateTime,
  disabledBy: UUID,
  revokedAt: DateTime,
  revokedBy: UUID,
  lastScannedAt: DateTime,
  createdAt: DateTime,
  updatedAt: DateTime,
}
```

### QrBatchModel
```javascript
{
  id: UUID,
  batchNumber: String,
  purpose: String ('printing' or 'digital'),
  status: Enum('generated', 'printed', 'active', 'archived'),
  quantity: Integer,
  createdBy: UUID,
  notes: String,
  printJobRef: String,
  createdAt: DateTime,
  updatedAt: DateTime,
}
```
