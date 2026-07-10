# VeiloScan Call Service Backend

## Overview

This repository implements the backend for a call and chat service platform. It exposes REST APIs for organizations, calls, chats, and admin analytics, plus socket support for real-time signaling.

The backend is built on:
- Node.js / Express
- PostgreSQL / Sequelize
- Socket.IO
- Swagger API documentation

## Quick start

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create and configure `.env` at the project root.

3. Run database migrations before start:

   ```bash
   npm run prestart
   ```

4. Start the server:

   ```bash
   npm start
   ```

5. For development with auto-reload:

   ```bash
   npm run dev
   ```

## Entrypoint

- `server.js` starts the HTTP server and attaches Socket.IO.
- `src/app.js` configures Express middleware, routes, Swagger, and static assets.

## API base path

- HTTP APIs are mounted under `/api/v1/`
- Swagger UI is available at `/api-docs`
- Health check is available at `/`

## Important scripts

- `npm run format` — format code with Prettier
- `npm run lint` — lint code with ESLint and fix issues
- `npm run prestart` — run Sequelize migrations
- `npm run db:seed` — seed the database
- `npm run db:reset` — reset migrations
- `npm run db:create:script` — create the DB using utility script
- `npm run db:create:service` — create the service database
- `npm run create-admin` — create an admin account via script
- `npm run prod:start` — start with PM2 in production

## Environment variables

The app loads configuration from `.env`.

Minimum recommended variables:

- `PORT` - HTTP port
- `NODE_ENV`
- `BASE_URL`
- `ACCESS_TOKEN_SECRET` or `JWT_SECRET`
- `REFRESH_TOKEN_SECRET` or `JWT_SECRET`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_HOST`
- `DB_PORT`
- `DB_DIALECT`
- `ALLOWED_ORIGINS`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `ADMIN_USERNAME` (default: `admin`)
- `ADMIN_PASSWORD` (default: `admin123`)

## Auth

- HTTP API routes under `/api/v1/calls` and `/api/v1/chat-sessions` require an API key via `x-api-key`.
- `/api/v1/organizations` allows organization creation and API key creation without auth.
- Admin routes under `/api/v1/admin` require JWT authentication.
- Socket.io connections are authenticated via API key.

## Main routes

### Health

- `GET /` — service health check
- `GET /api/v1/healthz` — API health check

### Organizations

- `POST /api/v1/organizations` — create organization
- `POST /api/v1/organizations/:id/api-keys` — create API key for an organization
- `GET /api/v1/organizations/me` — get authenticated org details
- `PUT /api/v1/organizations/me` — update organization
- `DELETE /api/v1/organizations/me` — delete organization
- `GET /api/v1/organizations/me/api-keys` — list organization API keys
- `PATCH /api/v1/organizations/me/api-keys/:apiKeyId/revoke` — revoke API key

### Calls

- `POST /api/v1/calls/session` — create a call session
- `GET /api/v1/calls/session/:sessionId` — get call session details
- `POST /api/v1/calls/session/:sessionId/end` — end a call session
- `PATCH /api/v1/calls/session/:sessionId/accept` — accept a call session
- `PATCH /api/v1/calls/session/:sessionId/reject` — reject a call session

### Chat sessions

- `POST /api/v1/chat-sessions/rooms` — create a chat room
- `GET /api/v1/chat-sessions/rooms/:roomId` — get chat room details
- `PATCH /api/v1/chat-sessions/rooms/:roomId/status` — update room status
- `GET /api/v1/chat-sessions/rooms/:roomId/messages` — get messages for a room
- `PATCH /api/v1/chat-sessions/messages/:messageId/delivered` — mark a message delivered
- `PATCH /api/v1/chat-sessions/messages/:messageId/read` — mark a message read

### Admin

- `POST /api/v1/admin/login` — admin login
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/usage`
- `GET /api/v1/admin/api-keys/activity`
- `GET /api/v1/admin/organizations`
- `GET /api/v1/admin/organizations/:id`
- `PATCH /api/v1/admin/organizations/:id/activate`
- `PATCH /api/v1/admin/organizations/:id/deactivate`
- `GET /api/v1/admin/calls/stats`
- `GET /api/v1/admin/calls/over-time`
- `GET /api/v1/admin/calls/recent`
- `GET /api/v1/admin/chats/stats`
- `GET /api/v1/admin/chats/over-time`

## Notes

- Static files are served from `/public`, `/sdk`, and `/uploads`.
- Swagger docs are protected by basic auth configured via `SW_USERNAME` and `SW_PASSWORD`.
- The application expects PostgreSQL and uses Sequelize migrations.

## What changed

This README now reflects the actual project structure, entrypoints, environment variables, and routes implemented in this repository.

```
Browser A  Browser B
```

Media does not pass through the Communication Platform.

---

## Step 8 - End Call

Either participant leaves.

SDK emits:

```
leave-session
```

Platform updates participant state.

Platform emits:

```
call-ended
```

---

# Flexible Call Integration

Developers may:

### Option A

Use the full Call SDK.

Recommended.

SDK handles all WebRTC complexity.

---

### Option B

Use only signaling endpoints.

Advanced usage.

Developers can implement their own WebRTC layer and only use the platform for signaling.

---

# Chat Service Workflow

## Goal

Allow real-time messaging between users.

---

# Chat Architecture

```
User A
   |
Website A
   |
Chat SDK
   |
Communication Platform
   |
Database
   |
Communication Platform
   |
Chat SDK
   |
Website A
   |
User B
```

Unlike calls, chat messages pass through the Communication Platform and are stored.

---

# Chat SDK Responsibilities

The Chat SDK handles:

- Socket Connection
- Room Management
- Message Delivery
- Typing Indicators
- Event Handling

---

# Chat Flow

## Step 1 - Initialize SDK

```
const chatManager = new ChatManager({
    apiKey: "cp_live_xxxxxxxxx"
});
```

SDK authenticates with the platform.

---

## Step 2 - Join Room

User joins a chat room.

```
chatManager.joinRoom(roomId);
```

SDK emits:

```
join-room
```

---

## Step 3 - Send Message

User sends a message.

```
chatManager.sendMessage({
    senderId,
    receiverId,
    message
});
```

SDK emits:

```
send-message
```

---

## Step 4 - Platform Persists Message

Platform stores:

```
organizationId
senderId
receiverId
message
messageType
createdAt
```

Message is persisted.

---

## Step 5 - Message Delivered

Platform emits:

```
message-received
```

Receiving SDK triggers:

```
onMessage(...)
```

---

## Step 6 - Typing Indicators

User starts typing.

SDK emits:

```
typing
```

Receiver gets:

```
user-typing
```

When typing stops:

```
stop-typing
```

Receiver gets:

```
user-stop-typing
```

---

## Step 7 - Fetch Message History

Developer may call:

GET /chat/history

Platform returns persisted messages.

---

# Flexible Chat Integration

### Option A

Use Chat SDK.

Recommended.

Handles sockets and events automatically.

---

### Option B

Use APIs and Socket Events directly.

Developers can build their own frontend implementation while still using the Communication Platform backend.

---

# Security Model

Authentication is Organization-based.

```
Organization
    |
    API Key
    |
    Call Service
    |
    Chat Service
```

Users are managed by the consumer application.

The Communication Platform never authenticates end users.

---

# Usage Tracking

Every request is associated with:

```
organizationId
```

This enables future:

- Analytics
- Billing
- Usage Reports
- Rate Limiting
- Service Monitoring

without changing integration flows.
