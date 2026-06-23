# Chat Flow — Chat Module

## Overview

- Base route: `/api/v1/chat-sessions` (auth: `x-api-key` header required on all routes)
- Responsibilities: create rooms, persist messages, message delivery/read receipts, online presence, typing indicators, conversation state management, message history with pagination
- HTTP layer handles room/message management; Socket.IO handles all real-time events

---

## HTTP Endpoints

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | `/api/v1/chat-sessions/rooms` | `createRoom` | Create a new chat room |
| GET | `/api/v1/chat-sessions/rooms/:roomId` | `getRoom` | Get room details and status |
| PATCH | `/api/v1/chat-sessions/rooms/:roomId/status` | `updateRoomStatus` | Transition conversation state |
| GET | `/api/v1/chat-sessions/rooms/:roomId/messages` | `getMessages` | Paginated message history |
| PATCH | `/api/v1/chat-sessions/messages/:messageId/delivered` | `markDelivered` | Mark message as delivered |
| PATCH | `/api/v1/chat-sessions/messages/:messageId/read` | `markRead` | Mark message as read |

> Routes: `src/modules/chats/chat.routes.js`
> Controller: `src/modules/chats/chat.controller.js`
> Service: `src/modules/chats/chat.service.js`
> Repository: `src/repository/chat.repository.js`
> Socket: `src/modules/chats/chat.socket.js`

---

## State Definitions

### Message Status

```
sending → sent → delivered → read
                           ↘ failed
```

| Status | Description |
|--------|-------------|
| `sending` | Client optimistic state before server ACK |
| `sent` | Persisted to DB, broadcast to room |
| `delivered` | Receiver's socket received the message |
| `read` | Receiver opened the conversation |
| `failed` | Persistence or delivery error |

### Conversation (Room) Status

| Status | Description |
|--------|-------------|
| `active` | Normal open chat |
| `archived` | Preserved but hidden from default view |
| `closed` | Ended, no new messages |

### User Presence

| Status | Description |
|--------|-------------|
| `online` | Connected and active |
| `away` | Connected but idle for 5+ minutes |
| `offline` | Disconnected |

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `set-presence` | `{ userId, status }` | Set own presence (online/away/offline) |
| `get-presence` | `{ userIds[] }` | Request presence for a list of users |
| `join-room` | `{ roomId, userId }` | Join a chat room |
| `leave-room` | `{ roomId }` | Leave a chat room |
| `send-message` | `{ roomId, userId, message, receiverId?, messageType? }` | Send a message |
| `message-delivered` | `{ messageId, roomId }` | Acknowledge receipt |
| `message-read` | `{ messageId, roomId, userId }` | Mark a message as read |
| `room-read` | `{ roomId, userId }` | Mark all unread messages in room as read |
| `typing` | `{ roomId, userId }` | User started typing |
| `stop-typing` | `{ roomId, userId }` | User stopped typing |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `participant-joined` | `{ socketId, userId }` | Someone joined the room |
| `participant-left` | `{ socketId, userId, participants }` | Someone left |
| `message-received` | `{ id, roomId, senderId, receiverId, message, messageType, status, createdAt }` | New message broadcast |
| `message-status` | `{ messageId, status, deliveredAt?, readAt?, readBy? }` | Status update for a message |
| `room-read` | `{ roomId, userId }` | All messages marked read by userId |
| `message-error` | `{ roomId, error, status: 'failed' }` | Message delivery/save failure |
| `user-typing` | `{ userId }` | Peer started typing |
| `user-stop-typing` | `{ userId }` | Peer stopped typing |
| `presence-changed` | `{ userId, status, lastSeen }` | A user's presence changed |
| `presence-list` | `[{ userId, status, lastSeen }]` | Response to `get-presence` |
| `error` | `{ message }` | Generic error |

---

## Chat Flows

### Flow A — Send & Receive Message

```
Client A (sender)           Server                    Client B (receiver)
       |                       |                              |
       |── send-message ──────▶|                              |
       |   { roomId, message } |── saveMessage() ────────────|
       |                       |                              |
       |◀── message-received ──|── message-received ────────▶|
       |    { status: sent }   |    { status: sent }          |
       |                       |                              |
       |                       |  [B is online in room]       |
       |                       |── markDelivered(messageId)   |
       |◀── message-status ──  |── message-status ───────────▶|
       |    { status:          |    { status: delivered }      |
       |      delivered }      |                              |
       |                       |                              |
       |                       |◀── message-read ─────────── |
       |                       |   { messageId, userId: B }   |
       |                       |── markRead(messageId)        |
       |◀── message-status ──  |── message-status ───────────▶|
       |    { status: read }   |    { status: read }           |
```

### Flow B — Presence & Typing

```
Client A                    Server                    Client B
   |                           |                           |
   |── set-presence(online) ──▶|── presence-changed ──────▶|
   |                           |   { userId: A, online }   |
   |                           |                           |
   |── typing ────────────────▶|── user-typing ───────────▶|
   |                           |                           |
   |── stop-typing ────────────▶|── user-stop-typing ──────▶|
   |                           |                           |
   |  [idle for 5 minutes]     |                           |
   |── set-presence(away) ────▶|── presence-changed ──────▶|
   |                           |   { userId: A, away }     |
   |                           |                           |
   |── disconnect ─────────────|── presence-changed ──────▶|
                               |   { userId: A, offline,   |
                               |     lastSeen: <timestamp> }|
```

### Flow C — Message History & Sync on Reconnect

```
Client A                       Server
   |                               |
   |── connect ────────────────────|
   |── join-room ─────────────────▶|
   |                               |
   |  [load existing history]      |
   |── GET /rooms/:roomId/messages?limit=50
   |◀─ [ ...messages ] ────────────|
   |                               |
   |  [load more — infinite scroll]|
   |── GET /rooms/:roomId/messages?limit=50&before=<oldest_message_createdAt>
   |◀─ [ ...older messages ] ──────|
   |                               |
   |── room-read ─────────────────▶|  [mark all as read on open]
   |◀─ room-read ──────────────────|  [broadcast to room]
```

### Flow D — Read Receipts (Bulk)

```
Client B opens the conversation:
   B ── room-read { roomId, userId: B } ──▶ Server
   Server ── markRoomMessagesRead(roomId, B) ──▶ DB
   Server ── room-read ──▶ Client A  [A sees ✓✓ read on all messages]
```

---

## Presence Auto-Transitions

```
join-room / any activity  →  online  (resets 5-min idle timer)
idle for 5 minutes        →  away    (server-side timer per userId)
disconnect                →  offline (lastSeen recorded)
reconnect                 →  online  (on set-presence or join-room)
```

---

## SDK Reference

```javascript
import ChatManager, { PRESENCE } from '/sdk/chats-sdk/chatManager.js';

const chat = new ChatManager({
    apiKey:    'cp_live_...',
    userId:    'user-alice',
    socketUrl: 'https://your-platform.com',
});

await chat.connect();   // authenticates socket, announces online presence

// ── Rooms ──────────────────────────────────────────────────────────────────
chat.joinRoom('room-uuid');
chat.leaveRoom('room-uuid');

// ── Sending ────────────────────────────────────────────────────────────────
chat.sendMessage({ roomId: 'room-uuid', receiverId: 'user-bob', message: 'Hello!' });

// ── Receipts ───────────────────────────────────────────────────────────────
chat.markRead('message-uuid', 'room-uuid');   // single message
chat.markRoomRead('room-uuid');               // all unread in room

// ── Typing ────────────────────────────────────────────────────────────────
chat.startTyping('room-uuid');
chat.stopTyping('room-uuid');

// ── Presence ──────────────────────────────────────────────────────────────
chat.setPresence(PRESENCE.AWAY);             // manual override
chat.getPresence(['user-bob', 'user-carol']); // query presence of others

// ── Events ────────────────────────────────────────────────────────────────
chat.on('message',          (msg) => { /* render message */ });
chat.on('message-status',   ({ messageId, status }) => { /* update tick */ });
chat.on('room-read',        ({ roomId, userId }) => { /* all read */ });
chat.on('typing-start',     ({ userId }) => { /* show typing indicator */ });
chat.on('typing-stop',      ({ userId }) => { /* hide typing indicator */ });
chat.on('user-online',      ({ userId }) => { /* show green dot */ });
chat.on('user-offline',     ({ userId, lastSeen }) => { /* show last seen */ });
chat.on('user-away',        ({ userId }) => { /* show away indicator */ });
chat.on('presence-changed', ({ userId, status, lastSeen }) => { /* general */ });
chat.on('presence-list',    (list) => { /* batch presence update */ });
chat.on('participant-joined', ({ userId }) => { /* user entered room */ });
chat.on('participant-left',   ({ userId }) => { /* user left room */ });
chat.on('message-error',    ({ roomId, error }) => { /* show failed */ });
chat.on('disconnected',     () => { /* reconnect UI */ });

// ── Disconnect ────────────────────────────────────────────────────────────
chat.disconnect();   // announces offline, disconnects socket
```

---

## File Map

```
src/modules/chats/
├── chat.controller.js    — HTTP request handlers
├── chat.routes.js        — Express routes
├── chat.service.js       — Business logic
├── chat.socket.js        — All Socket.IO event handling, presence management
└── CHAT_FLOW.md          — This document

src/repository/
└── chat.repository.js    — DB queries (ChatRoom, ChatMessage models)

src/database/models/
├── chatRoom.model.js     — Room model (status: active/archived/closed)
└── chat.Message.model.js — Message model (status: sent/delivered/read/failed)

sdk/chats-sdk/
├── chatManager.js        — Full SDK: connect, send, receipts, presence, events
└── messageManager.js     — (legacy, superseded by chatManager.js)
```

---

_Last updated: 2026-06-23_
