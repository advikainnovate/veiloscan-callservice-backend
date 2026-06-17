# Communication Platform Workflow Documentation

## Overview

The Communication Platform provides communication capabilities to external applications through API Keys.

The platform does not:

- Manage users
- Handle authentication for end users
- Store user accounts

The platform only:

- Provides Call Services
- Provides Chat Services
- Authenticates Organizations using API Keys
- Tracks service usage

---

# High Level Architecture

```
External Website/Application
            |
            |
         API Key
            |
            v
Communication Platform
            |
    ------------------
    |                |
    v                v
Call Service    Chat Service
```

Example:

- Website A wants voice/video calling
- Website B wants real-time chat

Both applications integrate with the Communication Platform.

---

# Organization Onboarding Flow

## Step 1 - Create Organization

The consumer creates an organization.

Request:

POST /organizations

```
{
  "name": "Website A"
}
```

Response:

```
{
  "id": "org-uuid",
  "name": "Website A"
}
```

**Important:** An organization must have at least one active API key. The platform enforces this rule and tracks usage counts for calls and chat messages per organization.

**Endpoint:** `GET /api/v1/organizations/me` returns the authenticated organization's details, including its API keys and usage counters.

---

## Step 2 - Create API Key

Request:

POST /organizations/{organizationId}/api-keys

```
{
  "name": "Production"
}
```

Response:

```
{
  "apiKey": "cp_live_xxxxxxxxx"
}
```

Important:

The API Key is only shown once.

The platform stores only a hash of the API Key.

---

## Step 3 - Store API Key

The organization stores the API Key securely.

Example:

```
COMMUNICATION_API_KEY=cp_live_xxxxxxxxx
```

---

# Call Service Workflow

## Goal

Allow two users from an external application to establish a WebRTC call.

---

# Call Architecture

```
User A
   |
Website A
   |
Communication SDK
   |
Communication Platform
   |
Communication SDK
   |
Website A
   |
User B
```

The Communication Platform does not carry audio/video.

It only performs signaling.

Audio and video flow directly between browsers using WebRTC.

---

# Call SDK Responsibilities

The Call SDK handles:

- Socket Connection
- WebRTC Peer Connection
- Offer Generation
- Answer Generation
- ICE Candidate Handling
- Event Management

Developers should not need to manually manage WebRTC internals.

---

# Call Flow

## Step 1 - Initialize SDK

Website A initializes the SDK.

```
const callManager = new CallManager({
    apiKey: "cp_live_xxxxxxxxx"
});
```

The SDK authenticates with the platform using the API Key.

---

## Step 2 - User Joins Session

User A wants to start a call.

```
callManager.joinSession("session-123");
```

SDK emits:

```
join-session
```

Platform creates or joins the session.

---

## Step 3 - Second User Joins

User B joins the same session.

```
callManager.joinSession("session-123");
```

Platform detects two participants.

Platform emits:

```
call-started
```

---

## Step 4 - Offer Creation

SDK automatically creates a WebRTC Offer.

```
offer
```

Offer is sent through the Communication Platform.

---

## Step 5 - Answer Creation

Second SDK receives the Offer.

SDK automatically generates:

```
answer
```

Answer is routed through the Communication Platform.

---

## Step 6 - ICE Candidate Exchange

Both SDKs exchange ICE candidates.

```
ice-candidate
```

The platform only relays these messages.

---

## Step 7 - Peer Connection Established

Direct browser-to-browser connection is established.

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
