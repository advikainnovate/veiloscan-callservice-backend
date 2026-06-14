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
  userId: 'user-123',                    // Your user ID
  socketUrl: 'ws://localhost:4000',      // WebSocket server URL
  iceServers: [
    { urls: ['stun:stun.l.google.com:19302'] }
  ]
});
```

### 3. Connect to the Signaling Server

```javascript
await sdk.connect();
```

### 4. Listen for Events

```javascript
// Incoming call from another user
sdk.on(EVENTS.INCOMING_CALL, (callData) => {
  console.log('Incoming call from:', callData.callerId);
  // Show accept/reject UI to user
});

// Call was accepted
sdk.on(EVENTS.CALL_ACCEPTED, (data) => {
  console.log('Call accepted!');
});

// Remote stream is ready
sdk.on(EVENTS.REMOTE_STREAM, (stream) => {
  // Play remote audio
  audioElement.srcObject = stream;
});

// Call ended
sdk.on(EVENTS.CALL_ENDED, (data) => {
  console.log('Call ended');
});
```

### 5. Initiate a Call

```javascript
// Start a call to another user
await sdk.call('target-user-id');
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
  userId: string,           // Required: Your user ID
  socketUrl: string,        // Required: WebSocket server URL (e.g., ws://localhost:4000)
  iceServers: array,        // Optional: STUN/TURN servers for NAT traversal
  audio: boolean,           // Optional: Enable audio (default: true)
  video: boolean            // Optional: Enable video (default: false)
})
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
    credential: 'password'
  }
]
```

## Available Events

| Event | Data | Description |
|-------|------|-------------|
| `incomingCall` | `{ callerId, offer }` | Incoming call received |
| `callAccepted` | `{}` | Your call was accepted |
| `callRejected` | `{}` | Your call was rejected |
| `callEnded` | `{}` | Call has ended |
| `remoteStream` | `MediaStream` | Remote audio/video stream |

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
