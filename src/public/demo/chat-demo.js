import ChatManager from '/sdk/chats-sdk/chatManager.js';

const joinBtn = document.getElementById('joinBtn');
const sendBtn = document.getElementById('sendBtn');
const messages = document.getElementById('messages');
const input = document.getElementById('messageInput');
const roomIdField = document.getElementById('roomId');
const statusEl = document.getElementById('status');

let socket;
let chat;
let joined = false;
const userId = `user-${Math.random().toString(36).slice(2, 8)}`;

function addMessage(text, className) {
    const el = document.createElement('div');
    el.className = `message ${className}`;
    el.textContent = text;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
}

function setStatus(status) {
    if (statusEl) {
        statusEl.textContent = `Status: ${status}`;
    }
}

function connectSocket() {
    if (socket) return;
    socket = io();
    chat = new ChatManager(socket);

    socket.on('connect', () => {
        addMessage(`Connected as ${userId}`, 'from-me');
        setStatus('connected');
    });

    chat.onParticipantJoined((payload) => {
        addMessage(`Participant joined: ${payload.socketId}`, 'from-them');
    });

    chat.onMessage((message) => {
        if (message.senderId === userId) return;
        addMessage(`${message.senderId}: ${message.message}`, 'from-them');
    });

    socket.on('disconnect', () => {
        addMessage('Disconnected from socket', 'from-them');
        setStatus('disconnected');
    });

    socket.on('connect_error', (err) => {
        addMessage(`Socket connect_error: ${err.message || err}`, 'from-them');
        setStatus('connect_error');
    });

    socket.on('connect_timeout', () => {
        addMessage('Socket connect_timeout', 'from-them');
        setStatus('connect_timeout');
    });

    socket.on('error', (err) => {
        addMessage(`Socket error: ${err.message || err}`, 'from-them');
        setStatus('socket_error');
    });

    socket.on('message-error', (errorPayload) => {
        setStatus(`message error: ${errorPayload.error}`);
        addMessage(`Message failed: ${errorPayload.error}`, 'from-them');
    });
}

joinBtn.addEventListener('click', () => {
    const roomId = roomIdField.value.trim();
    if (!roomId) {
        alert('Enter a room ID first');
        return;
    }
    connectSocket();
    chat.joinRoom(roomId, userId);
    joined = true;
    addMessage(`Joined room ${roomId}`, 'from-me');
    setStatus(`joined ${roomId}`);
});

sendBtn.addEventListener('click', () => {
    if (!joined) {
        alert('Join a room first');
        return;
    }
    const roomId = roomIdField.value.trim();
    const text = input.value.trim();
    if (!text) return;
    const payload = {
        roomId,
        senderId: userId,
        message: text,
    };
    chat.sendMessage(payload);
    addMessage(`Me: ${text}`, 'from-me');
    input.value = '';
});
