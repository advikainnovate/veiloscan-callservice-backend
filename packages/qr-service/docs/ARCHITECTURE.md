# Architecture Overview

## Package Structure

```
packages/qr-service/
├── src/
│   ├── core/                    # Core business logic (framework/db agnostic)
│   │   ├── QRService.js        # Main service
│   │   ├── QRTokenService.js   # Token generation & formatting
│   │   ├── QRException.js      # Custom exceptions
│   │   └── index.js            # Core exports
│   ├── adapters/
│   │   ├── database/           # Database adapters
│   │   │   ├── IQRDatabaseAdapter.js    # Interface
│   │   │   ├── SequelizeQRAdapter.js   # Sequelize implementation
│   │   │   └── index.js
│   │   └── framework/          # Framework adapters
│   │       ├── ExpressAdapter.js       # Express controllers & helpers
│   │       ├── express.js              # Express router factory
│   │       └── index.js
│   └── index.js                # Main package exports
├── docs/
│   └── INTEGRATION.md           # Full integration guide
├── examples/
│   ├── basic-integration.js
│   ├── custom-adapter.js
│   ├── error-handling.js
│   └── direct-service-usage.js
├── package.json
└── README.md
```

## Design Principles

### 1. **Framework Agnostic**
- Core service has zero dependencies on Express, Fastify, etc.
- Framework integration is via adapters
- Easy to create adapters for any framework

### 2. **Database Agnostic**
- Core service implements business logic only
- Database operations delegated to adapter
- Adapter pattern enables MongoDB, Redis, custom DBs

### 3. **Modular Exports**
```javascript
// Use only what you need
const { QRService } = require('@your-org/qr-service');
const { SequelizeQRAdapter } = require('@your-org/qr-service');
const { createQRRouter } = require('@your-org/qr-service');
```

### 4. **Consistent Error Handling**
- Custom exceptions with proper HTTP status codes
- Easy to integrate with error middleware
- Details available for debugging

## Class Hierarchy

```
QRService
├── Uses: QRTokenService
├── Uses: DatabaseAdapter (interface)
└── Throws: QRException (and subclasses)

DatabaseAdapter (interface)
├── Implemented by: SequelizeQRAdapter
├── Can be implemented by: MongoDBAdapter, RedisAdapter, etc.

QRTokenService
├── generateSecureToken()
├── generateHumanToken()
├── extractQRCodeToken()
└── ... token utilities
```

## Data Flow

### Creating a QR Code
```
Express Route
    ↓
ExpressAdapter Controller
    ↓
QRService.createQRCode()
    ↓
DatabaseAdapter.createQRCode()
    ↓
Database (Sequelize)
```

### Scanning a QR Code
```
QR Token (from scan)
    ↓
QRTokenService.extractQRCodeToken()
    ↓
QRService.scanQRCode(token)
    ↓
DatabaseAdapter.findQRCodeByToken()
    ↓
QR Code Data
```

## Extension Points

### Adding a New Database
1. Create `SomeDBAdapter extends IQRDatabaseAdapter`
2. Implement all required methods
3. Use with: `new QRService(new SomeDBAdapter(...))`

### Adding a New Framework
1. Create adapter file `SomeFrameworkAdapter.js`
2. Implement framework-specific route/controller wiring
3. Export router factory: `createQRRouter(qrService, options)`

### Adding New QR Operations
1. Add method to `QRService`
2. Add database method to `IQRDatabaseAdapter`
3. Implement in all adapters
4. Create controller in framework adapters

## Testing Strategy

- **Unit tests** for `QRService` (mock adapter)
- **Unit tests** for `QRTokenService` (no dependencies)
- **Integration tests** for each adapter
- **E2E tests** with Express router

```javascript
// Unit test example
const { QRService } = require('@your-org/qr-service');
const mockAdapter = { /* mock all methods */ };
const service = new QRService(mockAdapter);

test('creates QR code', async () => {
  const result = await service.createQRCode();
  expect(result.success).toBe(true);
});
```

## Migration Path

### Step 1: Install in monorepo
```bash
npm install ./packages/qr-service
```

### Step 2: Update app.js to use new service
```javascript
const { QRService, SequelizeQRAdapter, createQRRouter } = require('@your-org/qr-service');
const qrService = new QRService(new SequelizeQRAdapter(db));
app.use('/api/qr', createQRRouter(qrService, { authMiddleware }));
```

### Step 3: Delete old module
```bash
rm -rf src/modules/qrCodes
```

### Step 4: Update tests
```javascript
// Before: import from src/modules/qrCodes
// After: import from @your-org/qr-service
```

## Performance Considerations

- **Token generation**: Uses crypto.randomBytes() - secure & fast
- **Batch creation**: Optimized with single query for batch numbers
- **Pagination**: Cursor-based for efficient large datasets
- **Database queries**: Minimal - only what's needed

## Security Features

- **Secure tokens**: 64-character hex (256-bit entropy)
- **Human tokens**: Limited character set to reduce confusion
- **No hardcoded secrets**: Configuration via environment
- **Audit trail**: Tracks who disabled/revoked codes
- **Status validation**: Prevents invalid state transitions

## Future Enhancements

- [ ] QR code image generation & serving
- [ ] Batch export/import
- [ ] Analytics & reporting
- [ ] Rate limiting per user
- [ ] Webhook events
- [ ] GraphQL adapter
- [ ] Redis caching adapter
- [ ] Multi-tenant support
