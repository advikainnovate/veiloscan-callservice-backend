# QR Code Service

A modular, framework and database-agnostic QR code service for generating, managing, and resolving QR codes.

## Features

- **Database Agnostic**: Works with any database via adapters (Sequelize, MongoDB, custom, etc.)
- **Framework Agnostic**: Core logic independent from Express, use adapters for framework integration
- **Token Management**: Secure token generation and human-readable tokens
- **Batch Management**: Create and manage QR code batches
- **Status Tracking**: Track QR code lifecycle (unassigned, active, disabled, revoked, etc.)

## Installation

```bash
npm install @your-org/qr-service
```

## Usage

### Basic Setup

```javascript
const { QRService } = require('@your-org/qr-service');
const { SequelizeAdapter } = require('@your-org/qr-service/adapters/database');

// Initialize with your database adapter
const qrService = new QRService({
    adapter: new SequelizeAdapter(db),
});

// Create a QR code
const qrCode = await qrService.createQRCode();

// Create a batch
const batch = await qrService.createQRCodeBatch({
    count: 100,
    purpose: 'printing',
    createdBy: 'admin-id',
});
```

### Express Integration

```javascript
const express = require('express');
const { expressRouter } = require('@your-org/qr-service/adapters/framework');

const app = express();
const qrRouter = expressRouter(qrService, options);

app.use('/api/qr', qrRouter);
```

## Adapters

### Database Adapters

- **SequelizeAdapter**: For Sequelize + PostgreSQL/MySQL/SQLite
- Create custom adapters by implementing the `IQRDatabaseAdapter` interface

### Framework Adapters

- **ExpressAdapter**: For Express.js
- Create custom adapters by implementing the `IQRFrameworkAdapter` interface

## API Reference

See [docs/API.md](docs/API.md)
