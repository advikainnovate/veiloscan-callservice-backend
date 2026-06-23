import ChatManager, { PRESENCE } from '/sdk/chats-sdk/chatManager.js';

// ─── DOM ──────────────────────────────────────────────────────────────────────
const apiKeyInput    = document.getElementById('apiKey');
const userIdInput    = document.getElementById('userId');
const roomIdInput    = document.getElementById('roomId');
const joinBtn        = document.getElementById('joinBtn');
const leaveBtn       = document.getElementById('leaveBtn');
const sendBtn        = document.getElementById('sendBtn');
const messageInput   = document.getElementById('messageInput');
const messagesEl     = document.getElementById('messages');
const statusBar      = document.getElementById('statusBar');
const statusText     = document.getElementById('statusText');
const typingEl       = document.getElementById('typingEl');
const presenceCard   = document.getElementById('presenceCard');
const presenceList   = document.getElementById('presenceList');

let chat      = null;
let userId    = null;
let roomId    = null;
let typingTimer = null;
const presenceMap = {};    // userId → status
const messageMap  = {};    // messageId → DOM element

// ─── Helpers ──────────────────────────────────────────────────────────────────
function setStatus(text, cls = '') {
    statusBar.className = `status-bar ${cls}`.trim();
    statusText.textContent = text;
}

function addMsg(text, type = 'them', id = null) {
    const el = document.createElement('div');
    el.className = `msg ${type}`;
    el.innerHTML = `<span class="msg-text">${escHtml(text)}</span>`;
    if (id) {
        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        meta.innerHTML = `<span class="msg-status" id="ms-${id}">✓ sent</span>`;
        el.appendChild(meta);
        messageMap[id] = el;
    }
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
}

function addSystem(text) {
    const el = document.createElement('div');
    el.className = 'msg system';
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function escHtml(str) {
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function updateMsgStatus(messageId, status) {
    const el = document.getElementById(`ms-${messageId}`);
    if (!el) return;
    const icons = { sent: '✓ sent', delivered: '✓✓ delivered', read: '✓✓ read', failed: '✗ failed' };
    el.textContent = icons[status] || status;
    if (status === 'read') el.style.color = '#68d391';
    if (status === 'failed') el.style.color = '#fc8181';
}

function renderPresence() {
    const entries = Object.entries(presenceMap);
    if (!entries.length) { presenceList.textContent = '—'; return; }
    presenceList.innerHTML = entries.map(([uid, status]) =>
        `<span>${escHtml(uid)} <span class="presence-badge ${status}">${status}</span></span>`
    ).join('');
}

// ─── Join ─────────────────────────────────────────────────────────────────────
joinBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    userId  = userIdInput.value.trim() || `user-${Math.random().toString(36).slice(2,8)}`;
    roomId  = roomIdInput.value.trim();

    if (!apiKey) { alert('Paste your API key first'); return; }
    if (!roomId) { alert('Enter a room ID'); return; }

    joinBtn.disabled = true;
    setStatus('connecting…');

    chat = new ChatManager({ apiKey, userId, socketUrl: window.location.origin });

    // ── wire events ──
    chat.on('connected', () => {
        chat.joinRoom(roomId);
        setStatus(`joined room: ${roomId}`, 'joined');
        addSystem(`You joined as ${userId}`);
        sendBtn.disabled = false;
        messageInput.disabled = false;
        leaveBtn.disabled = false;
        messageInput.focus();
        presenceCard.style.display = 'block';

        // Ask for presence of peer (demo: just ask for self to verify)
        presenceMap[userId] = PRESENCE.ONLINE;
        renderPresence();
    });

    chat.on('disconnected', () => {
        setStatus('disconnected', 'error');
        addSystem('Disconnected from server');
    });

    chat.on('participant-joined', ({ userId: uid }) => {
        if (uid && uid !== userId) {
            addSystem(`${uid} joined the room`);
            presenceMap[uid] = PRESENCE.ONLINE;
            renderPresence();
            // Ask server for their presence
            chat.getPresence([uid]);
        }
    });

    chat.on('participant-left', ({ userId: uid }) => {
        if (uid && uid !== userId) {
            addSystem(`${uid} left the room`);
        }
    });

    chat.on('message', (message) => {
        if (message.senderId === userId) return; // own messages shown on send
        const el = addMsg(`${message.senderId}: ${message.message}`, 'them', message.id);
        // Auto mark as read since we're looking at it
        setTimeout(() => chat.markRead(message.id, roomId), 300);
    });

    chat.on('message-status', ({ messageId, status }) => {
        updateMsgStatus(messageId, status);
    });

    chat.on('message-error', ({ error }) => {
        addSystem(`Message failed: ${error}`);
    });

    chat.on('typing-start', ({ userId: uid }) => {
        typingEl.textContent = `${uid} is typing…`;
    });

    chat.on('typing-stop', () => {
        typingEl.textContent = '';
    });

    chat.on('presence-changed', ({ userId: uid, status }) => {
        presenceMap[uid] = status;
        renderPresence();
        addSystem(`${uid} is now ${status}`);
    });

    chat.on('presence-list', (list) => {
        list.forEach(({ userId: uid, status }) => {
            presenceMap[uid] = status;
        });
        renderPresence();
    });

    chat.on('error', (err) => {
        setStatus('error', 'error');
        addSystem(`Error: ${err.message || err}`);
    });

    try {
        await chat.connect();
    } catch (err) {
        setStatus('connection failed', 'error');
        addSystem(`Connection failed: ${err.message}`);
        joinBtn.disabled = false;
    }
});

// ─── Leave ────────────────────────────────────────────────────────────────────
leaveBtn.addEventListener('click', () => {
    if (!chat) return;
    chat.leaveRoom(roomId);
    chat.disconnect();
    setStatus('left room', '');
    addSystem('You left the room');
    sendBtn.disabled = true;
    messageInput.disabled = true;
    leaveBtn.disabled = true;
    joinBtn.disabled = false;
});

// ─── Send ─────────────────────────────────────────────────────────────────────
function sendMessage() {
    const text = messageInput.value.trim();
    if (!text || !chat) return;

    // Show optimistically
    const tempId = `temp-${Date.now()}`;
    addMsg(`Me: ${text}`, 'me', tempId);
    updateMsgStatus(tempId, 'sending');

    chat.sendMessage({ roomId, message: text });
    messageInput.value = '';

    // Stop typing
    chat.stopTyping(roomId);
    clearTimeout(typingTimer);
    typingTimer = null;
}

sendBtn.addEventListener('click', sendMessage);

messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { sendMessage(); return; }

    if (!typingTimer && chat) chat.startTyping(roomId);
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
        if (chat) chat.stopTyping(roomId);
        typingTimer = null;
    }, 2000);
});
