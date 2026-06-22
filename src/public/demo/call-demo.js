import CallSDK from '/sdk/calls-sdk/index.js';
import { EVENTS } from '/sdk/calls-sdk/constants.js';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const apiKeyInput    = document.getElementById('apiKey');
const userIdInput    = document.getElementById('userId');
const sessionInput   = document.getElementById('sessionId');
const enableVideoChk = document.getElementById('enableVideo');
const connectBtn     = document.getElementById('connectBtn');
const endCallBtn     = document.getElementById('endCallBtn');
const muteBtn        = document.getElementById('muteBtn');
const videoBtn       = document.getElementById('videoBtn');
const statusBar      = document.getElementById('statusBar');
const statusText     = document.getElementById('statusText');
const durationEl     = document.getElementById('durationEl');
const qualityBadge   = document.getElementById('qualityBadge');
const controlsCard   = document.getElementById('controlsCard');
const logBox         = document.getElementById('logBox');
const localAudio     = document.getElementById('localAudio');
const remoteAudio    = document.getElementById('remoteAudio');
const localVideo     = document.getElementById('localVideo');
const remoteVideo    = document.getElementById('remoteVideo');
const incomingOverlay = document.getElementById('incomingOverlay');
const incomingFrom   = document.getElementById('incomingFrom');
const acceptBtn      = document.getElementById('acceptBtn');
const rejectBtn      = document.getElementById('rejectBtn');

let sdk = null;
let durationInterval = null;
let pendingSessionId = null; // holds sessionId from incoming-call

// ─── Logging ──────────────────────────────────────────────────────────────────
function log(msg, level = 'info') {
    const el = document.createElement('div');
    el.className = `e ${level}`;
    el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logBox.appendChild(el);
    logBox.scrollTop = logBox.scrollHeight;
}

// ─── Status ───────────────────────────────────────────────────────────────────
function setStatus(text, cls = 'idle') {
    statusBar.className = `status-bar ${cls}`;
    statusText.textContent = text;
}

// ─── Duration ticker ──────────────────────────────────────────────────────────
function startDurationTicker() {
    durationEl.textContent = '0:00';
    durationInterval = setInterval(() => {
        if (!sdk) return;
        const s = sdk.getCallDuration();
        durationEl.textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }, 1000);
}

function stopDurationTicker() {
    clearInterval(durationInterval);
    durationEl.textContent = '';
}

// ─── Media helpers ────────────────────────────────────────────────────────────
function showMedia(localStream, isVideo) {
    if (isVideo) {
        localVideo.srcObject = localStream;
        localVideo.style.display = 'block';
        localAudio.style.display = 'none';
    } else {
        localAudio.srcObject = localStream;
    }
}

function showRemote(remoteStream, isVideo) {
    if (isVideo) {
        remoteVideo.srcObject = remoteStream;
        remoteVideo.style.display = 'block';
        remoteAudio.style.display = 'none';
    } else {
        remoteAudio.srcObject = remoteStream;
    }
}

function clearMedia() {
    localAudio.srcObject = remoteAudio.srcObject = null;
    localVideo.srcObject = remoteVideo.srcObject = null;
    localVideo.style.display = remoteVideo.style.display = 'none';
    localAudio.style.display = remoteAudio.style.display = 'block';
}

// ─── Reset UI after call ends ─────────────────────────────────────────────────
function resetUI() {
    stopDurationTicker();
    clearMedia();
    qualityBadge.style.display = 'none';
    endCallBtn.disabled = true;
    muteBtn.disabled = true;
    videoBtn.disabled = true;
    connectBtn.disabled = false;
    controlsCard.style.display = 'none';
    muteBtn.textContent = '🎤 Mute';
    muteBtn.classList.remove('muted');
    videoBtn.textContent = '📷 Camera Off';
    videoBtn.classList.remove('active');
}

// ─── Register SDK events ──────────────────────────────────────────────────────
function wireEvents(isVideo) {
    // Incoming call — show overlay (callee side)
    sdk.on(EVENTS.INCOMING_CALL, ({ sessionId, callerId }) => {
        pendingSessionId = sessionId;
        incomingFrom.textContent = `from ${callerId}`;
        incomingOverlay.classList.add('show');
        setStatus('incoming call…', 'ringing');
        log(`Incoming call from ${callerId} — session: ${sessionId}`, 'warn');
    });

    // Caller told: callee accepted
    sdk.on(EVENTS.CALL_ACCEPTED, ({ calleeId }) => {
        log(`Call accepted by ${calleeId}`, 'ok');
        setStatus('connecting…', 'connecting');
    });

    // Caller told: callee rejected
    sdk.on(EVENTS.CALL_REJECTED, ({ calleeId }) => {
        log(`Call rejected by ${calleeId}`, 'warn');
        setStatus('call rejected', 'ended');
        resetUI();
    });

    // Participant joined room
    sdk.on(EVENTS.PARTICIPANT_JOINED, ({ participants }) => {
        log(`Participant joined — ${participants}/2 in room`, 'ok');
        setStatus(`waiting for peer (${participants}/2)`, 'connecting');
        endCallBtn.disabled = false;
    });

    // Participant left
    sdk.on(EVENTS.PARTICIPANT_LEFT, ({ participants }) => {
        log(`Participant left — ${participants} remaining`, 'warn');
    });

    // Call started (both peers present, WebRTC negotiating)
    sdk.on(EVENTS.CALL_STARTED, () => {
        log('Call started — WebRTC negotiating', 'ok');
        setStatus('connected', 'connected');
        startDurationTicker();
        muteBtn.disabled = false;
        videoBtn.disabled = !isVideo;
        controlsCard.style.display = 'block';
    });

    // Local stream ready
    sdk.on(EVENTS.LOCAL_STREAM, (stream) => {
        showMedia(stream, isVideo);
        log('Local media captured', 'ok');
    });

    // Remote stream received
    sdk.on(EVENTS.REMOTE_STREAM, (stream) => {
        showRemote(stream, isVideo);
        log('Remote stream received', 'ok');
    });

    // Call paused (reconnection window)
    sdk.on(EVENTS.CALL_PAUSED, ({ reason }) => {
        log(`Call paused — ${reason}`, 'warn');
        setStatus('paused — reconnecting…', 'connecting');
        stopDurationTicker();
    });

    // Call resumed
    sdk.on(EVENTS.CALL_RESUMED, () => {
        log('Call resumed', 'ok');
        setStatus('connected', 'connected');
        startDurationTicker();
    });

    // Call ended
    sdk.on(EVENTS.CALL_ENDED, ({ reason, duration }) => {
        const dur = duration != null ? ` (${duration}s)` : '';
        log(`Call ended — ${reason}${dur}`, 'warn');
        setStatus(`ended: ${reason}`, 'ended');
        resetUI();
    });

    // Timeout (no answer from callee)
    sdk.on(EVENTS.CALL_TIMEOUT, () => {
        log('Call timed out — no answer', 'warn');
        setStatus('no answer', 'ended');
        resetUI();
    });

    // Status changed
    sdk.on(EVENTS.STATUS_CHANGED, ({ status }) => {
        log(`Status → ${status}`);
    });

    // Mute change from remote peer
    sdk.on(EVENTS.MUTE_CHANGED, ({ muted, remote, userId }) => {
        if (remote) log(`Remote peer ${userId || ''} ${muted ? 'muted' : 'unmuted'}`, 'info');
    });

    // Video change from remote peer
    sdk.on(EVENTS.VIDEO_CHANGED, ({ videoEnabled, remote, userId }) => {
        if (remote) log(`Remote peer ${userId || ''} turned camera ${videoEnabled ? 'on' : 'off'}`, 'info');
    });

    // Connection quality
    sdk.on(EVENTS.CONNECTION_QUALITY, ({ quality, rtt }) => {
        qualityBadge.style.display = 'inline-block';
        qualityBadge.className = quality;
        qualityBadge.textContent = `${quality}${rtt != null ? ` ${Math.round(rtt * 1000)}ms` : ''}`;
        if (quality !== 'good') log(`Connection quality: ${quality}`, 'warn');
    });

    // Connection lost (ICE failure)
    sdk.on(EVENTS.CONNECTION_LOST, ({ state }) => {
        log(`ICE connection ${state}`, 'err');
        setStatus(`connection ${state}`, 'failed');
    });

    // Error
    sdk.on(EVENTS.ERROR, (err) => {
        log(`Error: ${err.message || err}`, 'err');
        setStatus('error', 'failed');
    });

    // Room full
    sdk.on(EVENTS.ROOM_FULL, () => {
        log('Room is full — cannot join', 'err');
        setStatus('room full', 'failed');
        resetUI();
    });
}

// ─── Connect & Join ───────────────────────────────────────────────────────────
connectBtn.addEventListener('click', async () => {
    const apiKey    = apiKeyInput.value.trim();
    const userId    = userIdInput.value.trim() || `user-${Math.random().toString(36).slice(2, 8)}`;
    const sessionId = sessionInput.value.trim();
    const isVideo   = enableVideoChk.checked;

    if (!apiKey) { alert('Paste your API key first'); return; }

    connectBtn.disabled = true;
    setStatus('connecting…', 'connecting');
    log(`Connecting as ${userId}${isVideo ? ' (video)' : ' (audio)'}`);

    try {
        sdk = new CallSDK({
            apiKey,
            userId,
            socketUrl: window.location.origin,
            audio: true,
            video: isVideo,
        });

        wireEvents(isVideo);

        await sdk.connect();
        log('Socket authenticated', 'ok');

        if (sessionId) {
            await sdk.joinSession(sessionId);
            log(`Joined session: ${sessionId}`, 'ok');
            setStatus('waiting for peer…', 'connecting');
            endCallBtn.disabled = false;
        } else {
            setStatus('connected — enter session ID to join or wait for incoming call', 'connecting');
            log('Ready — waiting for incoming call or enter session ID to join', 'info');
        }

    } catch (err) {
        log(`Connection failed: ${err.message}`, 'err');
        setStatus('connection failed', 'failed');
        connectBtn.disabled = false;
    }
});

// ─── End Call ─────────────────────────────────────────────────────────────────
endCallBtn.addEventListener('click', async () => {
    if (!sdk) return;
    await sdk.endCall();
    log('End call sent', 'warn');
    setStatus('ended', 'ended');
    resetUI();
});

// ─── Mute toggle ──────────────────────────────────────────────────────────────
muteBtn.addEventListener('click', () => {
    if (!sdk) return;
    const nowMuted = !sdk.isMuted();
    sdk.setMuted(nowMuted);
    muteBtn.textContent = nowMuted ? '🔇 Unmute' : '🎤 Mute';
    muteBtn.classList.toggle('muted', nowMuted);
    log(nowMuted ? 'Microphone muted' : 'Microphone unmuted');
});

// ─── Video toggle ─────────────────────────────────────────────────────────────
videoBtn.addEventListener('click', () => {
    if (!sdk) return;
    const nowEnabled = !sdk.isVideoEnabled();
    sdk.setVideoEnabled(nowEnabled);
    videoBtn.textContent = nowEnabled ? '📷 Camera Off' : '📷 Camera On';
    videoBtn.classList.toggle('active', nowEnabled);
    log(nowEnabled ? 'Camera on' : 'Camera off');
});

// ─── Incoming call — Accept ───────────────────────────────────────────────────
acceptBtn.addEventListener('click', () => {
    incomingOverlay.classList.remove('show');
    if (!sdk || !pendingSessionId) return;
    sdk.acceptCall(pendingSessionId);
    // After accepting, join the session room
    sdk.joinSession(pendingSessionId);
    endCallBtn.disabled = false;
    log(`Accepted call — joining session ${pendingSessionId}`, 'ok');
    setStatus('connecting…', 'connecting');
    pendingSessionId = null;
});

// ─── Incoming call — Reject ───────────────────────────────────────────────────
rejectBtn.addEventListener('click', () => {
    incomingOverlay.classList.remove('show');
    if (!sdk || !pendingSessionId) return;
    sdk.rejectCall(pendingSessionId);
    log('Call rejected', 'warn');
    setStatus('idle', 'idle');
    pendingSessionId = null;
});
