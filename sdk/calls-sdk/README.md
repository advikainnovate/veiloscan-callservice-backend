# Veiloscan Calls SDK

Install the package in your website app:

```bash
npm install @veiloscan/calls-sdk
```

Usage:

```javascript
import CallSDK, { EVENTS } from '@veiloscan/calls-sdk';

const sdk = new CallSDK({
  apiKey: 'your-api-key',
  userId: 'user-123',
  socketUrl: 'https://your-backend.example.com',
});

await sdk.connect();
```

For a browser script setup, use the browser entrypoint:

```javascript
import CallSDK from '@veiloscan/calls-sdk/browser';
```
