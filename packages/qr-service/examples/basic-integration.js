# Example: Using QR Service in Your App

This example shows how to integrate the modular QR Service into your backend application.

## Before

In the old structure, QR code logic was embedded in `/src/modules/qrCodes/`:

```
src/
  modules/
    qrCodes/
      qrCode.controller.js
      qrCode.service.js
      qrCode.routes.js
      qrCode.repository.js
      ...
```

## After

Now QR code is a standalone service that can be used in any app:

```javascript
// src/app.js

const express = require('express');
const {
  QRService,
  SequelizeQRAdapter,
  createQRRouter,
} = require('@your-org/qr-service');
const db = require('./database/models');
const { validateAccessToken } = require('./middlewares');

const app = express();

// Initialize QR Service with Sequelize adapter
const qrService = new QRService(new SequelizeQRAdapter(db));

// Create router with auth middleware
const qrRouter = createQRRouter(qrService, {
  authMiddleware: validateAccessToken(['admin']),
});

// Mount on your API
app.use('/api/qr', qrRouter);

// ... rest of app setup

module.exports = app;
```

## Using in Different Apps

Same QR service can be used in multiple apps with different configurations:

### App 1: Admin Portal
```javascript
const qrService = new QRService(new SequelizeQRAdapter(db));
app.use('/api/qr', createQRRouter(qrService, { authMiddleware: adminAuth }));
```

### App 2: Public Mobile App
```javascript
const qrService = new QRService(new SequelizeQRAdapter(db));
// Only register public endpoints
app.post('/api/qr/scan', (req, res) => {
  // Scan endpoint only
});
```

### App 3: Custom Implementation (MongoDB)
```javascript
const qrService = new QRService(new MongoDBAdapter(mongoClient));
// Use same business logic with different database
```

## Programmatic Usage

Use the service directly without Express:

```javascript
const { QRService, SequelizeQRAdapter } = require('@your-org/qr-service');
const db = require('./database/models');

const qrService = new QRService(new SequelizeQRAdapter(db));

// In your business logic
async function setupUserAccount(userId) {
  // Create a QR code for the user
  const { data: qrCode } = await qrService.createQRCode();
  
  // Assign it to user
  await qrService.assignQRCode(qrCode.id, userId);
  
  // Get all user's codes
  const { data: codes } = await qrService.getUserQRCodes(userId);
  
  return codes;
}
```

## Next Steps

1. **Remove old module**: Delete `/src/modules/qrCodes/`
2. **Update imports**: Change imports from `./modules/qrCodes` to the new package
3. **Test**: Run your test suite to ensure everything works
4. **Deploy**: Push changes and deploy new version

The service is now reusable across all your applications!
