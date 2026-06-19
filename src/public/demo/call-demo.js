import CallSDK from '/sdk/calls-sdk/index.js';

const apiKeyInput   = document.getElementById('apiKey');
const sessionInput  = document.getElementById('sessionId');
const userIdInput   = document.getElementById('userId');
const connectBtn    = document.getElementById('connectBtn');
const endCallBtn    = document.getElementById('endCallBtn');
const localAudio    = document.getElementById('localAudio');
const remoteAudio   = document.getElementById('remoteAudio');
const statusBar     = document.getElementById('statusBar');
const logBox        = document.getElementById('logBox');

let sdk = null;

// ─── helpers ─────────────────────────────────────────────────────────────────

function log(msg, level = 'info') {
    const el = document.createElement('div');
    el.className = `entry ${level}`;
    el.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
    logBox.appendChild(el);
    logBox.scrollTop = logBox.scrollHeight;
}

function setStatus(text, cls = '') {
    statusBar.textContent = `Status: ${text}`;
    statusBar.className = `status-bar ${cls}`.trim();
}

// ─── connect & join ───────────────────────────────────────────────────────────

connectBtn.addEventListener('click', async () => {
    const apiKey    = apiKeyInput.value.trim();
    const sessionId = sessionInput.value.trim();
    const userId    = userIdInput.value.trim() || `user-${Math.random().toString(36).slice(2, 8)}`;

    if (!apiKey)    { alert('Paste your API key first'); return; }
    if (!sessionId) { alert('Enter a session ID'); return; }

    connectBtn.disabled = true;
    setStatus('connecting…');
    log(`Connecting as ${userId}`);

    try {
        sdk = new CallSDK({
            apiKey,
            userId,
            socketUrl: window.location.origin,
            audio: true,
            video: false,
        });

        // ── events ──
        sdk.on('participant-joined', (payload) => {
            log(`Participant joined — total: ${payload.participants}`, 'ok');
            setStatus(`waiting for peer (${payload.participants}/2)`, 'connected');
        });

        sdk.on('call-started', () => {
            log('Call started — WebRTC negotiation in progress', 'ok');
            setStatus('call active', 'active');
        });

        sdk.on('local-stream', (stream) => {
            localAudio.srcObject = stream;
            log('Microphone captured', 'ok');
        });

        sdk.on('remote-stream', (stream) => {
            remoteAudio.srcObject = stream;
            log('Remote audio stream received', 'ok');
        });

        sdk.on('call-paused', ({ reason }) => {
            log(`Call paused — ${reason}`, 'warn');
            setStatus('call paused (reconnecting…)', 'connected');
        });

        sdk.on('call-resumed', () => {
            log('Call resumed', 'ok');
            setStatus('call active', 'active');
        });

        sdk.on('call-ended', ({ reason }) => {
            log(`Call ended — ${reason}`, 'warn');
            setStatus('call ended', 'ended');
            endCallBtn.disabled = true;
            connectBtn.disabled = false;
            localAudio.srcObject  = null;
            remoteAudio.srcObject = null;
        });

        sdk.on('participant-left', ({ socketId, participants }) => {
            log(`Participant left (${socketId}), remaining: ${participants}`, 'warn');
        });

        sdk.on('error', (err) => {
            log(`Error: ${err.message || err}`, 'err');
            setStatus('error', 'error');
        });

        // ── connect then join ──
        await sdk.connect();
        log('Socket authenticated', 'ok');
        setStatus('joined — waiting for peer', 'connected');

        await sdk.joinSession(sessionId);
        log(`Joined session: ${sessionId}`, 'ok');
        endCallBtn.disabled = false;

    } catch (err) {
        log(`Failed to connect: ${err.message}`, 'err');
        setStatus('connection failed', 'error');
        connectBtn.disabled = false;
    }
});

// ─── end call ────────────────────────────────────────────────────────────────

endCallBtn.addEventListener('click', async () => {
    if (!sdk) return;
    await sdk.endCall();
    log('End call sent', 'warn');
    setStatus('ended', 'ended');
    endCallBtn.disabled = true;
    connectBtn.disabled = false;
    localAudio.srcObject  = null;
    remoteAudio.srcObject = null;
});
