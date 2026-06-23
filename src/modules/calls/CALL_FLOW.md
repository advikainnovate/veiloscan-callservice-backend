# Call Flow — Call Module

## Overview

- Base route: `/api/v1/calls` (auth: `x-api-key` header required on all routes)
- Responsibilities: create call sessions, ringing/accept/reject flow, WebRTC signaling, reconnection, mute/video controls, quality monitoring
- HTTP layer handles session lifecycle; Socket.IO handles all real-time signaling

---

## HTTP Endpoints

| Method | Path | Controller | Description |
|--------|------|------------|-------------|
| POST | `/api/v1/calls/session` | `createSession` | Create a new call session record |
| GET | `/api/v1/calls/session/:sessionId` | `getSession` | Get session details and current status |
| PATCH | `/api/v1/calls/session/:sessionId/accept` | `acceptSession` | Mark session as `connecting` (HTTP counterpart to socket accept) |
| PATCH | `/api/v1/calls/session/:sessionId/reject` | `rejectSession` | Mark session as `ended` (HTTP counterpart to socket reject) |
| POST | `/api/v1/calls/session/:sessionId/end` | `endSession` | End session and record duration |

> Routes: `src/modules/calls/call.routes.js`
> Controller: `src/modules/calls/call.controller.js`
> Service: `src/modules/calls/call.session.service.js`
> Repository: `src/repository/call.repository.js`
> Signaling: `src/modules/calls/signaling.socket.js`
> Socket helpers: `src/helpers/sockets/roomManager.js`, `src/helpers/sockets/connectionManager.js`

---

## Session Status States

```
idle → ringing → connecting → connected → ended
                                        ↘ failed
```

| Status | Description |
|--------|-------------|
| `idle` | Session created, no participants yet |
| `ringing` | Caller initiated, callee is being alerted |
| `connecting` | Callee accepted, both joining room / ICE negotiating |
| `connected` | Both peers in room, media flowing |
| `paused` | One peer disconnected, within reconnection window |
| `ended` | Call terminated normally |
| `failed` | ICE failure or unrecoverable error |

---

## Socket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `initiate-call` | `{ sessionId, callerId, calleeId }` | Caller rings the callee |
| `accept-call` | `{ sessionId, calleeId }` | Callee accepts the incoming call |
| `reject-call` | `{ sessionId, calleeId }` | Callee rejects the incoming call |
| `join-session` | `{ sessionId, userId? }` | Join the WebRTC room |
| `offer` | `{ sessionId, offer, senderId }` | Send SDP offer |
| `answer` | `{ sessionId, answer, senderId }` | Send SDP answer |
| `ice-candidate` | `{ sessionId, candidate, senderId }` | Forward ICE candidate |
| `mute-changed` | `{ sessionId, userId, muted }` | Broadcast mute state to peer |
| `video-changed` | `{ sessionId, userId, videoEnabled }` | Broadcast video state to peer |
| `leave-session` | `{ sessionId }` | Graceful leave (opens reconnection window) |
| `end-call` | `{ sessionId }` | Explicit end — no reconnection |
| `pong` | — | Heartbeat response |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `incoming-call` | `{ sessionId, callerId, calleeId }` | Sent to callee when ringing starts |
| `call-accepted` | `{ sessionId, calleeId }` | Sent to caller when callee accepts |
| `call-rejected` | `{ sessionId, calleeId }` | Sent to caller when callee rejects |
| `call-failed` | `{ reason, sessionId }` | Callee not connected / unreachable |
| `call-timeout` | `{ sessionId, reason }` | No answer within 45s |
| `participant-joined` | `{ socketId, participants }` | Someone joined the room |
| `participant-left` | `{ socketId, participants, canReconnect }` | Someone left |
| `call-started` | — | Both peers in room, WebRTC begins |
| `call-paused` | `{ reason, disconnectedSocketId, reconnectTimeoutSeconds }` | Peer disconnected, waiting |
| `call-resumed` | — | Peer rejoined within window |
| `call-ended` | `{ reason, endedBy? }` | Call over (see reasons below) |
| `mute-changed` | `{ sessionId, userId, muted }` | Relayed from peer |
| `video-changed` | `{ sessionId, userId, videoEnabled }` | Relayed from peer |
| `room-full` | `{ sessionId }` | Room already has 2 participants |
| `ping` | — | Heartbeat (every 5s) |
| `offer` / `answer` / `ice-candidate` | — | Relayed to the other peer |

**`call-ended` reasons:** `user-ended` · `all-participants-left` · `reconnection-timeout` · `caller-timeout`

---

## Call Flows

### Flow A — Direct Join (no ringing)

Both peers know the session ID and join directly.

```
Client A                    Server                     Client B
   |                           |                           |
   |── POST /calls/session ──▶ |                           |
   |◀─ 201 { sessionId } ──── |                           |
   |                           |                           |
   |── join-session ─────────▶ |                           |
   |                           |── participant-joined ───▶ (no one yet)
   |                           |                           |
   |                           |◀── join-session ─────────|
   |◀─ participant-joined ──── |                           |
   |◀─ call-started ────────── |── call-started ─────────▶|
   |                           |   activateSession()        |
   |── offer ─────────────────▶|── offer ────────────────▶|
   |                           |◀── answer ───────────────|
   |◀─ answer ──────────────── |                           |
   |⟺ ice-candidate (both) ───▶|◀──── ice-candidate ──────|
   |                           |                           |
   |         [media flows peer-to-peer via WebRTC]         |
   |                           |                           |
   |── end-call ──────────────▶|                           |
   |◀─ call-ended ─────────── |── call-ended ────────────▶|
```

### Flow B — Ringing Flow (caller/callee)

Caller rings a specific callee by userId before joining the room.

```
Caller                      Server                      Callee
   |                           |                           |
   |── POST /calls/session ──▶ |                           |
   |◀─ 201 { sessionId } ──── |                           |
   |                           |                           |
   |── initiate-call ─────────▶|── incoming-call ────────▶|
   |   { sessionId,            |   { sessionId, callerId } |
   |     callerId, calleeId }  |                           |
   |                           |   [45s ring timer starts] |
   |                           |                           |
   |                           |◀── accept-call ───────── |
   |◀─ call-accepted ───────── |                           |
   |                           |   [ring timer cleared]    |
   |                           |                           |
   |── join-session ─────────▶ |◀── join-session ─────────|
   |◀─ call-started ────────── |── call-started ─────────▶|
   |                           |                           |
   |         [WebRTC negotiation & media]                   |
```

**Rejection path:**
```
   |                           |◀── reject-call ───────── |
   |◀─ call-rejected ───────── |                           |
   |   [call ends]             |                           |
```

**No answer (45s timeout):**
```
   |◀─ call-timeout ─────────  |── call-ended ───────────▶|
   |   { reason: no-answer }   |   { reason: caller-timeout }
```

**Callee offline:**
```
   |◀─ call-failed ─────────── |
   |   { reason: user-unavailable }
```

### Flow C — Reconnection

Peer disconnects unexpectedly; 30s window to rejoin.

```
Client A                    Server                     Client B
   |                           |                           |
   |         [call active]     |                           |
   |                           |    Client B disconnects   |
   |                           |◀── disconnect ────────────|
   |◀─ participant-left ─────  |   pauseSession()          |
   |◀─ call-paused ─────────── |   [30s timer starts]      |
   |   { reconnectTimeout: 30 }|                           |
   |                           |                           |
   |                           |◀── join-session ──────── | (within 30s)
   |◀─ call-resumed ────────── |── call-resumed ─────────▶|
   |                           |   resumeSession()         |
   |                           |   [timer cleared]         |
```

**If 30s expires with no reconnect:**
```
   |◀─ call-ended ─────────── |
   |   { reason: reconnection-timeout }
```

---

## Controls (Real-time)

### Mute / Unmute

```
Client A ── mute-changed { muted: true } ──▶ Server ── mute-changed ──▶ Client B
```
- Server relays to the other peer in the session room
- SDK: `sdk.setMuted(true)` / `sdk.setMuted(false)` / `sdk.isMuted()`

### Camera On / Off

```
Client A ── video-changed { videoEnabled: false } ──▶ Server ── video-changed ──▶ Client B
```
- SDK: `sdk.setVideoEnabled(true/false)` / `sdk.isVideoEnabled()`

---

## Connection Quality Monitoring

SDK polls `RTCPeerConnection.getStats()` every 4 seconds.

| Metric | Good | Weak | Poor |
|--------|------|------|------|
| RTT | < 300ms | 300–600ms | > 600ms |
| Packet loss | < 5% | 5–15% | > 15% |

- SDK emits `connection-quality` event: `{ quality, rtt, lossRate }`
- ICE state changes (`failed`, `disconnected`, `closed`) emit `connection-lost`

---

## Heartbeat

- Server pings all room participants every 5s
- Clients respond with `pong`
- Detects stale connections

---

## SDK Reference

```javascript
// Initialise
const sdk = new CallSDK({
    apiKey: 'cp_live_...',
    userId: 'user-alice',
    socketUrl: 'https://your-platform.com',
    audio: true,
    video: false,              // true for video calls
});

await sdk.connect();

// ── Direct join ──────────────────────────────────────────────
await sdk.joinSession('session-uuid');

// ── Ringing flow ─────────────────────────────────────────────
await sdk.initiateCall('session-uuid', 'user-bob'); // caller

sdk.on('incoming-call', ({ sessionId, callerId }) => {  // callee
    sdk.acceptCall(sessionId);   // or sdk.rejectCall(sessionId)
    sdk.joinSession(sessionId);
});

// ── Media events ─────────────────────────────────────────────
sdk.on('local-stream',  (stream) => { videoEl.srcObject = stream; });
sdk.on('remote-stream', (stream) => { videoEl.srcObject = stream; });

// ── Call lifecycle ────────────────────────────────────────────
sdk.on('call-started',  () => { /* start UI timer */ });
sdk.on('call-paused',   ({ reason }) => { /* show reconnecting */ });
sdk.on('call-resumed',  () => { /* restore UI */ });
sdk.on('call-ended',    ({ reason, duration }) => { /* cleanup */ });

// ── Controls ─────────────────────────────────────────────────
sdk.setMuted(true);             // mute mic
sdk.setVideoEnabled(false);     // turn off camera
sdk.getCallDuration();          // seconds since call started
sdk.getStatus();                // idle|ringing|connecting|connected|ended|failed

// ── End call ─────────────────────────────────────────────────
await sdk.endCall();            // immediate, no reconnection window
await sdk.leaveSession();       // graceful leave, opens reconnection window

// ── Quality & errors ─────────────────────────────────────────
sdk.on('connection-quality', ({ quality, rtt, lossRate }) => {});
sdk.on('connection-lost',    ({ state }) => {});
sdk.on('status-changed',     ({ status }) => {});
sdk.on('error',              (err) => {});
```

---

## File Map

```
src/modules/calls/
├── call.controller.js       — HTTP request handlers
├── call.routes.js           — Express routes
├── call.session.service.js  — Business logic, status transitions
├── signaling.socket.js      — All Socket.IO event handling
└── CALL_FLOW.md             — This document

src/repository/
└── call.repository.js       — DB queries (CallSession model)

src/database/models/
└── call.session.model.js    — Sequelize model

src/helpers/sockets/
├── connectionManager.js     — userId ↔ socket object registry
├── roomManager.js           — Room membership tracking
└── socketRegistry.js        — userId ↔ socketId mapping

sdk/calls-sdk/
├── index.js                 — Public SDK API
├── callManager.js           — Core logic, event handling
├── signaling.js             — Socket.IO connection
├── webrtc.js                — RTCPeerConnection wrapper
├── constants.js             — EVENTS, CALL_STATUS, QUALITY enums
└── EventEmitter.js          — Base event emitter
```

---

_Last updated: 2026-06-23_
