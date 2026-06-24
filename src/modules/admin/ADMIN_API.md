# Admin API

## Overview

The Admin API provides internal dashboard and management endpoints for the platform operator.
It is completely separate from the organization-facing API — it uses JWT auth instead of API keys.

**Base path:** `/api/v1/admin`
**Auth:** `Authorization: Bearer <token>` (all endpoints except `/login`)

---

## Authentication

### Login

```
POST /api/v1/admin/login
```

**Body:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "expiresIn": "2d"
  }
}
```

Credentials are set via environment variables:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

The token must be included as a `Bearer` header on every subsequent request.

---

## Dashboard

### Platform Overview

```
GET /api/v1/admin/overview
```

Returns a high-level snapshot of the entire platform.

**Response:**
```json
{
  "success": true,
  "data": {
    "organizations": { "total": 12, "active": 10, "inactive": 2 },
    "calls":         { "total": 430, "active": 3 },
    "messages":      { "total": 8420 },
    "rooms":         { "total": 95 },
    "apiKeys":       { "active": 18 }
  }
}
```

---

### Usage By Organization

```
GET /api/v1/admin/usage
```

All organizations ranked by call request count.

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Per page (default: 20) |
| `from` | ISO date | Start of date range |
| `to` | ISO date | End of date range |

---

### API Key Activity

```
GET /api/v1/admin/api-keys/activity
```

All API keys sorted by `lastUsedAt` (most recently used first). Includes owning organization name. `apiKeyHash` is excluded.

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Per page (default: 20) |

---

## Organization Management

### List Organizations

```
GET /api/v1/admin/organizations
```

Paginated list of all organizations with their API keys.

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page number (default: 1) |
| `limit` | number | Per page (default: 20) |
| `search` | string | Filter by name (case-insensitive) |

---

### Get Organization

```
GET /api/v1/admin/organizations/:id
```

Full organization detail including all API keys (hashes excluded).

---

### Activate Organization

```
PATCH /api/v1/admin/organizations/:id/activate
```

Sets `isActive = true`. The organization's API keys become usable again. Auth middleware allows calls and chats once active.

---

### Deactivate Organization

```
PATCH /api/v1/admin/organizations/:id/deactivate
```

Sets `isActive = false`. All API key auth checks will reject this organization's keys immediately — no calls or chats can be initiated until reactivated.

---

## Call Analytics

### Call Stats

```
GET /api/v1/admin/calls/stats
```

Aggregated call metrics for a date range.

| Param | Type | Description |
|-------|------|-------------|
| `from` | ISO date | Start of range |
| `to` | ISO date | End of range |

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 430,
    "byStatus": {
      "idle": 2,
      "ringing": 5,
      "connecting": 3,
      "connected": 1,
      "ended": 410,
      "failed": 9
    },
    "avgDurationSeconds": 187,
    "videoCalls": 62,
    "audioCalls": 368
  }
}
```

---

### Calls Over Time

```
GET /api/v1/admin/calls/over-time
```

Call volume grouped by time period — use this to power line/bar charts.

| Param | Type | Description |
|-------|------|-------------|
| `from` | ISO date | Start of range |
| `to` | ISO date | End of range |
| `interval` | string | `hour` \| `day` \| `month` (default: `day`) |

**Response:**
```json
{
  "success": true,
  "data": [
    { "period": "2026-06-01T00:00:00.000Z", "count": 34 },
    { "period": "2026-06-02T00:00:00.000Z", "count": 51 }
  ]
}
```

---

### Recent Calls

```
GET /api/v1/admin/calls/recent
```

Paginated call session list, newest first.

| Param | Type | Description |
|-------|------|-------------|
| `page` | number | Page (default: 1) |
| `limit` | number | Per page (default: 20) |
| `status` | string | Filter: `idle` \| `ringing` \| `connecting` \| `connected` \| `ended` \| `failed` |
| `from` | ISO date | Start of range |
| `to` | ISO date | End of range |

---

## Chat Analytics

### Chat Stats

```
GET /api/v1/admin/chats/stats
```

Aggregated chat metrics for a date range.

| Param | Type | Description |
|-------|------|-------------|
| `from` | ISO date | Start of range |
| `to` | ISO date | End of range |

**Response:**
```json
{
  "success": true,
  "data": {
    "totalMessages": 8420,
    "byStatus": {
      "sent": 100,
      "delivered": 3200,
      "read": 5050,
      "failed": 70
    },
    "byType": {
      "text": 7900,
      "image": 430,
      "file": 90
    },
    "rooms": {
      "total": 95,
      "active": 42
    }
  }
}
```

---

### Messages Over Time

```
GET /api/v1/admin/chats/over-time
```

Message volume grouped by time period — use this to power line/bar charts.

| Param | Type | Description |
|-------|------|-------------|
| `from` | ISO date | Start of range |
| `to` | ISO date | End of range |
| `interval` | string | `hour` \| `day` \| `month` (default: `day`) |

**Response:**
```json
{
  "success": true,
  "data": [
    { "period": "2026-06-01T00:00:00.000Z", "count": 210 },
    { "period": "2026-06-02T00:00:00.000Z", "count": 380 }
  ]
}
```

---

## Route Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/admin/login` | None | Get admin JWT token |
| GET | `/admin/overview` | JWT | Platform snapshot |
| GET | `/admin/usage` | JWT | Usage ranked by org |
| GET | `/admin/api-keys/activity` | JWT | API key last-used list |
| GET | `/admin/organizations` | JWT | List all organizations |
| GET | `/admin/organizations/:id` | JWT | Get one organization |
| PATCH | `/admin/organizations/:id/activate` | JWT | Activate org |
| PATCH | `/admin/organizations/:id/deactivate` | JWT | Deactivate org |
| GET | `/admin/calls/stats` | JWT | Call metrics |
| GET | `/admin/calls/over-time` | JWT | Calls time-series |
| GET | `/admin/calls/recent` | JWT | Recent call list |
| GET | `/admin/chats/stats` | JWT | Chat metrics |
| GET | `/admin/chats/over-time` | JWT | Messages time-series |

---

## File Map

```
src/modules/admin/
├── admin.controller.js   — HTTP handlers
├── admin.routes.js       — Express routes (login public, rest JWT-protected)
├── admin.service.js      — Business logic + JWT signing
└── ADMIN_API.md          — This document

src/repository/
└── admin.repository.js   — All analytics DB queries

src/middlewares/
└── adminAuth.js          — JWT verification middleware (role: admin)
```

---

## Security Notes

- Admin credentials live in environment variables — never commit real values
- JWT tokens expire in `2d` (configurable via `ACCESS_TOKEN_TIME` in config)
- The `/login` endpoint does **not** use bcrypt — credentials are plain env var comparison. For production, replace with a hashed admin user in the database
- Admin routes are completely independent of the organization API key system

---

_Last updated: 2026-06-23_
