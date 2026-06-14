/**
 * SDK Integration Example - Call Test Page
 * This demonstrates how to use the Calls SDK in a client application
 */

// Import SDK components (adjust path based on your deployment)
import CallSDK from '../../sdk/calls-sdk/index.js';
import { EVENTS } from '../../sdk/calls-sdk/constants.js';

// DOM Elements
const log = document.getElementById('log');
const statusDiv = document.getElementById('status');
const userIdInput = document.getElementById('userId');
const socketUrlInput = document.getElementById('socketUrl');
const targetUserIdInput = document.getElementById('targetUserId');
const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const callBtn = document.getElementById('callBtn');
const acceptBtn = document.getElementById('acceptBtn');
const rejectBtn = document.getElementById('rejectBtn');
const hangupBtn = document.getElementById('hangupBtn');
const startMicBtn = document.getElementById('startMicBtn');
const stopMicBtn = document.getElementById('stopMicBtn');
const remoteAudio = document.getElementById('remoteAudio');

// State
let sdk = null;
let localStream = null;
let isConnected = false;
let incomingCall = null;

/**
 * Log helper with timestamp
 */
function logMessage(message, type = 'info') {
  const time = new Date().toLocaleTimeString();
  const line = `[${time}] ${message}`;
  console.log(line);
  log.value += line + '\n';
  log.scrollTop = log.scrollHeight;
}

/**
 * Update status display
 */
function updateStatus(message, type = 'info') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
}

/**
 * Initialize SDK and connect to signaling server
 */
async function connect() {
  try {
    const userId = userIdInput.value.trim();
    const socketUrl = socketUrlInput.value.trim();

    if (!userId) {
      updateStatus('❌ Please enter a User ID', 'error');
      logMessage('ERROR: User ID is required');
      return;
    }

    if (!socketUrl) {
      updateStatus('❌ Please enter a Socket Server URL', 'error');
      logMessage('ERROR: Socket Server URL is required');
      return;
    }

    logMessage(`Initializing SDK with userId: ${userId}`);
    updateStatus('⏳ Connecting...', 'info');

    // Initialize SDK with configuration
    sdk = new CallSDK({
      userId,
      socketUrl,
      iceServers: [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] }
      ]
    });

    // Register event listeners
    setupEventListeners();

    // Connect to signaling server
    await sdk.connect();

    logMessage('✅ Connected to signaling server');
    updateStatus(`✅ Connected as ${userId}`, 'connected');
    isConnected = true;

    // Update button states
    connectBtn.disabled = true;
    disconnectBtn.disabled = false;
    callBtn.disabled = false;
    startMicBtn.disabled = false;
  } catch (error) {
    logMessage(`❌ Connection failed: ${error.message}`, 'error');
    updateStatus(`❌ Connection failed: ${error.message}`, 'error');
  }
}

/**
 * Disconnect from signaling server
 */
function disconnect() {
  try {
    if (sdk) {
      sdk = null;
    }
    isConnected = false;
    logMessage('Disconnected from signaling server');
    updateStatus('Disconnected', 'info');

    // Update button states
    connectBtn.disabled = false;
    disconnectBtn.disabled = true;
    callBtn.disabled = true;
    acceptBtn.disabled = true;
    rejectBtn.disabled = true;
    hangupBtn.disabled = true;
    startMicBtn.disabled = true;
    stopMicBtn.disabled = true;
  } catch (error) {
    logMessage(`Error during disconnect: ${error.message}`);
  }
}

/**
 * Setup SDK event listeners
 */
function setupEventListeners() {
  if (!sdk) return;

  // Incoming call received
  sdk.on(EVENTS.INCOMING_CALL, (callData) => {
    logMessage(`📞 Incoming call from ${callData.callerId}`);
    updateStatus(`📞 Incoming call from ${callData.callerId}`, 'info');
    incomingCall = callData;

    acceptBtn.disabled = false;
    rejectBtn.disabled = false;
    callBtn.disabled = true;
  });

  // Call accepted
  sdk.on(EVENTS.CALL_ACCEPTED, (data) => {
    logMessage('✅ Call accepted');
    updateStatus('✅ Call accepted', 'connected');
    hangupBtn.disabled = false;
  });

  // Call rejected
  sdk.on(EVENTS.CALL_REJECTED, (data) => {
    logMessage('❌ Call rejected');
    updateStatus('❌ Call rejected', 'error');
    resetCallState();
  });

  // Call ended
  sdk.on(EVENTS.CALL_ENDED, (data) => {
    logMessage('📞 Call ended');
    updateStatus('Call ended', 'info');
    resetCallState();
  });

  // Remote stream available
  sdk.on(EVENTS.REMOTE_STREAM, (stream) => {
    logMessage('🎤 Remote stream received');
    remoteAudio.srcObject = stream;
    updateStatus('🎤 Remote stream active', 'connected');
  });
}

/**
 * Initiate a call to target user
 */
async function initiateCall() {
  try {
    const targetUserId = targetUserIdInput.value.trim();

    if (!targetUserId) {
      updateStatus('❌ Please enter Target User ID', 'error');
      logMessage('ERROR: Target User ID is required');
      return;
    }

    if (!isConnected || !sdk) {
      updateStatus('❌ Not connected', 'error');
      logMessage('ERROR: Not connected to signaling server');
      return;
    }

    logMessage(`📞 Initiating call to ${targetUserId}...`);
    updateStatus(`📞 Calling ${targetUserId}...`, 'info');

    await sdk.call(targetUserId);

    callBtn.disabled = true;
    hangupBtn.disabled = false;
    logMessage('✅ Call initiated, waiting for answer...');
  } catch (error) {
    logMessage(`❌ Call failed: ${error.message}`, 'error');
    updateStatus(`❌ Call failed: ${error.message}`, 'error');
  }
}

/**
 * Accept incoming call
 */
async function acceptCall() {
  try {
    if (!incomingCall) {
      logMessage('ERROR: No incoming call to accept');
      return;
    }

    logMessage('✅ Accepting call...');
    updateStatus('✅ Accepting call...', 'connected');

    // Start microphone if not already started
    if (!localStream) {
      await startMic();
    }

    // TODO: Send acceptance signal back through signaling
    // This would typically involve emitting an event through the SDK

    acceptBtn.disabled = true;
    rejectBtn.disabled = true;
    hangupBtn.disabled = false;

    logMessage('✅ Call accepted');
  } catch (error) {
    logMessage(`❌ Accept failed: ${error.message}`, 'error');
    updateStatus(`❌ Accept failed: ${error.message}`, 'error');
  }
}

/**
 * Reject incoming call
 */
function rejectCall() {
  try {
    if (!incomingCall) {
      logMessage('ERROR: No incoming call to reject');
      return;
    }

    logMessage('❌ Rejecting call...');
    updateStatus('❌ Call rejected', 'info');

    // TODO: Send rejection signal through SDK

    resetCallState();
  } catch (error) {
    logMessage(`❌ Reject failed: ${error.message}`, 'error');
  }
}

/**
 * End current call
 */
function endCall() {
  try {
    logMessage('📞 Ending call...');
    updateStatus('Ending call...', 'info');

    // TODO: Send end signal through SDK
    // Stop mic
    stopMic();

    resetCallState();

    logMessage('✅ Call ended');
    updateStatus('Call ended', 'info');
  } catch (error) {
    logMessage(`❌ End call failed: ${error.message}`, 'error');
  }
}

/**
 * Start microphone and capture local stream
 */
async function startMic() {
  try {
    if (localStream) {
      logMessage('⚠️ Microphone already started');
      return;
    }

    logMessage('🎤 Starting microphone...');
    updateStatus('🎤 Starting microphone...', 'info');

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false
    });

    logMessage('✅ Microphone started');
    updateStatus('🎤 Microphone active', 'connected');

    startMicBtn.disabled = true;
    stopMicBtn.disabled = false;
  } catch (error) {
    logMessage(`❌ Microphone failed: ${error.message}`, 'error');
    updateStatus(`❌ Microphone failed: ${error.message}`, 'error');
  }
}

/**
 * Stop microphone
 */
function stopMic() {
  try {
    if (!localStream) {
      logMessage('⚠️ No active microphone');
      return;
    }

    localStream.getTracks().forEach(track => track.stop());
    localStream = null;

    logMessage('✅ Microphone stopped');
    updateStatus('Microphone stopped', 'info');

    startMicBtn.disabled = false;
    stopMicBtn.disabled = true;
  } catch (error) {
    logMessage(`❌ Stop microphone failed: ${error.message}`, 'error');
  }
}

/**
 * Reset call state
 */
function resetCallState() {
  incomingCall = null;
  acceptBtn.disabled = true;
  rejectBtn.disabled = true;
  hangupBtn.disabled = true;
  callBtn.disabled = false;
  remoteAudio.srcObject = null;
}

// Event listeners
connectBtn.addEventListener('click', connect);
disconnectBtn.addEventListener('click', disconnect);
callBtn.addEventListener('click', initiateCall);
acceptBtn.addEventListener('click', acceptCall);
rejectBtn.addEventListener('click', rejectCall);
hangupBtn.addEventListener('click', endCall);
startMicBtn.addEventListener('click', startMic);
stopMicBtn.addEventListener('click', stopMic);

logMessage('🚀 SDK Test Page Ready');
logMessage('1. Enter your User ID and Socket Server URL');
logMessage('2. Click "Connect"');
logMessage('3. Open another tab with a different User ID');
logMessage('4. Enter the second user ID in Target User ID field');
logMessage('5. Click "Initiate Call" to start calling');
