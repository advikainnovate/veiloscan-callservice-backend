import ChatManager from '/sdk/chats-sdk/chatManager.js';

const apiKeyInput    = document.getElementById('apiKey');
const roomIdInput    = document.getElementById('roomId');
const userIdInput    = document.getElementById('userId');
const joinBtn        = document.getElementById('joinBtn');
const sendBtn        = document.getElementById('sendBtn');
const messageInput   = document.getElementById('messageInput');
const messagesEl     = document.getElementById('messages');
const statusBar      = document.getElementById('statusBar');
const typingEl       = document.getElementById('typingIndicator');

let chat   = null;
let socket = null;
let userId = null;
let roomId = null;
let typingTimer = null;

// ─── helpers ─────────────────────────────────────────────────────────────────

function addMessage(text, type = 'them') {
    const el = document.createElement('div');
    el.className = `msg ${type}`;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setStatus(text, cls = '') {
    statusBar.textContent = `Status: ${text}`;
    statusBar.className = `status-bar ${cls}`.trim();
}

// ─── join ─────────────────────────────────────────────────────────────────────

joinBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    roomId       = roomIdInput.value.trim();
    userId       = userIdInput.value.trim() || `user-${Math.random().toString(36).slice(2, 8)}`;

    if (!apiKey) { alert('Paste your API key first'); return; }
    if (!roomId) { alert('Enter a room ID'); return; }

    joinBtn.disabled = true;
    setStatus('connecting…');

    // Connect socket with API key auth
    socket = io(window.location.origin, {
        auth: { apiKey },
        autoConnect: false,
    });

    socket.on('connect_error', (err) => {
        setStatus(`connection failed: ${err.message}`, 'error');
        addMessage(`Connection failed: ${err.message}`, 'system');
        joinBtn.disabled = false;
    });

    socket.on('connect', () => {
        chat = new ChatManager(socket);

        // ── events ──
        chat.onParticipantJoined(({ socketId }) => {
            if (socketId !== socket.id) {
                addMessage(`${socketId.slice(0, 8)}… joined the room`, 'system');
            }
        });

        chat.onParticipantLeft(({ socketId }) => {
            addMessage(`${socketId.slice(0, 8)}… left the room`, 'system');
        });

        chat.onMessage((message) => {
            if (message.senderId === userId) return; // already shown on send
            addMessage(`${message.senderId}: ${message.message}`, 'them');
        });

        chat.onTyping(({ userId: typingUser }) => {
            if (typingUser === userId) return;
            typingEl.textContent = `${typingUser} is typing…`;
        });

        chat.onStopTyping(({ userId: typingUser }) => {
            if (typingUser === userId) return;
            typingEl.textContent = '';
        });

        socket.on('message-error', ({ error }) => {
            addMessage(`Failed to send: ${error}`, 'system');
        });

        // ── join room ──
        chat.joinRoom(roomId, userId);
        addMessage(`You joined as ${userId}`, 'system');
        setStatus(`joined room: ${roomId}`, 'joined');

        sendBtn.disabled    = false;
        messageInput.disabled = false;
        messageInput.focus();
    });

    socket.connect();
});

// ─── send ─────────────────────────────────────────────────────────────────────

function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !chat) return;

    chat.sendMessage({ roomId, userId, message: text });
    addMessage(`Me: ${text}`, 'me');
    messageInput.value = '';

    // stop typing indicator
    chat.stopTyping({ roomId, userId });
    clearTimeout(typingTimer);
    typingTimer = null;
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { sendMessage(); return; }

    // typing indicator
    if (!typingTimer && chat) {
        chat.typing({ roomId, userId });
    }
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        if (chat) chat.stopTyping({ roomId, userId });
        typingTimer = null;
    }, 2000);
});
