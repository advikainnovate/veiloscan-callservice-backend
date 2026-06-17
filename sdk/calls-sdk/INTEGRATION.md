# Calls SDK Integration Guide

This guide shows you how to integrate the Calls SDK into your client application to add real-time audio calling capabilities.

## Quick Start

### 1. Import the SDK

```javascript
import CallSDK from './sdk/calls-sdk/index.js';
import { EVENTS } from './sdk/calls-sdk/constants.js';
```

### 2. Initialize the SDK

```javascript
const sdk = new CallSDK({
    apiKey: 'cp_live_xxxxxxxxx', // Required: Your organization API Key
    userId: 'user-123', // Optional: Your user ID
    socketUrl: 'http://localhost:4000', // Required: Socket.io server URL
    iceServers: [{ urls: ['stun:stun.l.google.com:19302'] }],
});
```

### 3. Connect to the Signaling Server

```javascript
await sdk.connect();
```

### 4. Listen for Events

```javascript
// A participant joined the room session
sdk.on('participant-joined', (data) => {
    console.log('Participant joined:', data.socketId);
});

// Call has officially started between two peers
sdk.on('call-started', () => {
    console.log('Call started!');
});

// Captured local media stream
sdk.on('local-stream', (stream) => {
    localAudioElement.srcObject = stream;
});

// Remote stream is ready
sdk.on(EVENTS.REMOTE_STREAM, (stream) => {
    // Play remote audio
    audioElement.srcObject = stream;
});

// Call ended
sdk.on('call-ended', (data) => {
    console.log('Call ended because:', data.reason);
});
```

### 5. Join a Call Session

```javascript
// Join a call room session (WebRTC connection is negotiated automatically)
await sdk.joinSession('session-123');
```

## Complete Example

See `src/public/test-webrtc-sdk.js` and `src/public/test-webrtc.html` for a complete working example.

### Running the Example

1. Start the backend server:

    ```bash
    npm run dev
    ```

2. Open the test page in your browser:

    ```
    http://localhost:4000/public/test-webrtc.html
    ```

3. In the first tab:
    - Enter "user-001" as Your User ID
    - Click "Connect"
    - Enter "user-002" in Target User ID
    - Click "Initiate Call"

4. In a second tab (same page):
    - Enter "user-002" as Your User ID
    - Click "Connect"
    - You should see an incoming call notification
    - Click "Accept Call"

5. Both tabs should now have active audio connection

## SDK Architecture

### Components

- **CallSDK** - Main entry point that manages the call lifecycle
- **CallManager** - Orchestrates WebRTC connections and signaling
- **WebRTC** - Handles RTCPeerConnection and media streams
- **Signaling** - WebSocket-based signaling protocol
- **EventEmitter** - Pub/sub event system

### Call Flow

```
User A                              User B
  |                                   |
  +-- Connect SDK ------>  Signaling  <---- Connect SDK
  |                           |
  +-- Initiate Call  ------>  |  ----> Incoming Call Event
  |                           |
  +-- Create WebRTC Offer --> |  ----> Handle Offer
  |                           |
  +-- Set Remote Answer <--   |  <---- Create Answer
  |                           |
  +-- Exchange ICE ---------->|<------ Exchange ICE
  |                           |
  +-- Media Streaming starts  |
  |<=========================>|
```

## Configuration Options

### SDK Constructor

```javascript
new CallSDK({
    apiKey: string, // Required: Your organization API key
    userId: string, // Optional: Your user ID (auto-generated if omitted)
    socketUrl: string, // Required: Socket.io server URL (e.g., http://localhost:4000)
    iceServers: array, // Optional: STUN/TURN servers for NAT traversal
    audio: boolean, // Optional: Enable audio (default: true)
    video: boolean, // Optional: Enable video (default: false)
});
```

### ICE Servers

For production, configure STUN/TURN servers:

```javascript
iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] },
    { urls: ['stun:stun1.l.google.com:19302'] },
    {
        urls: ['turn:your-turn-server.com'],
        username: 'username',
        credential: 'password',
    },
];
```

## Available Events

| Event                | Data                                                        | Description                                     |
| -------------------- | ----------------------------------------------------------- | ----------------------------------------------- |
| `joined-session`     | `{ sessionId }`                                             | Emitted when you successfully join the session  |
| `participant-joined` | `{ socketId, participants }`                                | Emitted when a participant joins the session    |
| `participant-left`   | `{ socketId, participants, canReconnect }`                  | Emitted when a participant leaves the session   |
| `call-started`       | `{}`                                                        | Emitted when the call officially connects       |
| `call-paused`        | `{ reason, disconnectedSocketId, reconnectTimeoutSeconds }` | Emitted when call is temporarily paused         |
| `call-resumed`       | `{}`                                                        | Emitted when the disconnected peer rejoins      |
| `call-ended`         | `{ reason }`                                                | Emitted when the call is ended                  |
| `local-stream`       | `MediaStream`                                               | Emitted when your local media stream is ready   |
| `remoteStream`       | `MediaStream`                                               | Emitted when the remote peer stream is received |

## Troubleshooting

### Connection Issues

1. **WebSocket connection failed**
    - Verify Socket.IO is running on the backend
    - Check the socketUrl is correct (e.g., `ws://localhost:4000`)
    - Check browser console for CORS or network errors

2. **No remote stream received**
    - Verify microphone permissions are granted
    - Check ICE servers are accessible
    - Ensure both peers are connected and listening

3. **Call signaling not working**
    - Verify backend is running and Socket.IO is initialized
    - Check that user IDs are correctly formatted
    - Look at backend WebSocket logs for errors

## Browser Compatibility

- Chrome/Chromium 60+
- Firefox 55+
- Safari 14.1+
- Edge 79+

WebRTC requires HTTPS in production (except for localhost testing).

## See Also

- [SDK Architecture](./ARCHITECTURE.md)
- Test page example: `src/public/test-webrtc.html`
