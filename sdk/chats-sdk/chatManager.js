/* global io */

export const PRESENCE = { ONLINE: 'online', AWAY: 'away', OFFLINE: 'offline' };
export const MESSAGE_STATUS = { SENDING: 'sending', SENT: 'sent', DELIVERED: 'delivered', READ: 'read', FAILED: 'failed' };
export const ROOM_STATUS = { ACTIVE: 'active', ARCHIVED: 'archived', CLOSED: 'closed' };

export default class ChatManager {
    /**
     * @param {object} config
     * @param {string} config.apiKey
     * @param {string} config.userId
     * @param {string} config.socketUrl
     */
    constructor(config) {
        this.apiKey    = config.apiKey;
        this.userId    = config.userId;
        this.socketUrl = config.socketUrl || window.location.origin;
        this.socket    = null;
        this._handlers = {};
    }

    // ── Connection ────────────────────────────────────────────────────────────

    connect() {
        return new Promise((resolve, reject) => {
            const socketio = typeof io !== 'undefined' ? io : window.io;
            if (!socketio) return reject(new Error('Socket.io not loaded'));

            this.socket = socketio(this.socketUrl, {
                auth: { apiKey: this.apiKey },
                autoConnect: false,
            });

            this.socket.connect();
            this.socket.on('connect', () => {
                // Announce online presence
                this.socket.emit('set-presence', { userId: this.userId, status: PRESENCE.ONLINE });
                resolve();
            });
            this.socket.on('connect_error', reject);

            this._wireSocketEvents();
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.emit('set-presence', { userId: this.userId, status: PRESENCE.OFFLINE });
            this.socket.disconnect();
        }
    }

    // ── Rooms ─────────────────────────────────────────────────────────────────

    joinRoom(roomId) {
        this._emit('join-room', { roomId, userId: this.userId });
    }

    leaveRoom(roomId) {
        this._emit('leave-room', { roomId });
    }

    // ── Messages ──────────────────────────────────────────────────────────────

    sendMessage({ roomId, receiverId, message, messageType = 'text' }) {
        this._emit('send-message', {
            roomId,
            userId: this.userId,
            receiverId: receiverId || null,
            message,
            messageType,
        });
    }

    acknowledgeDelivered(messageId, roomId) {
        this._emit('message-delivered', { messageId, roomId });
    }

    markRead(messageId, roomId) {
        this._emit('message-read', { messageId, roomId, userId: this.userId });
    }

    markRoomRead(roomId) {
        this._emit('room-read', { roomId, userId: this.userId });
    }

    // ── Typing ────────────────────────────────────────────────────────────────

    startTyping(roomId) {
        this._emit('typing', { roomId, userId: this.userId });
    }

    stopTyping(roomId) {
        this._emit('stop-typing', { roomId, userId: this.userId });
    }

    // ── Presence ──────────────────────────────────────────────────────────────

    setPresence(status) {
        this._emit('set-presence', { userId: this.userId, status });
    }

    getPresence(userIds) {
        this._emit('get-presence', { userIds });
    }

    // ── Events ────────────────────────────────────────────────────────────────

    on(event, callback) {
        this._handlers[event] = this._handlers[event] || [];
        this._handlers[event].push(callback);
    }

    off(event, callback) {
        if (!this._handlers[event]) return;
        this._handlers[event] = this._handlers[event].filter((h) => h !== callback);
    }

    _emit(event, payload) {
        if (!this.socket) throw new Error('Not connected. Call connect() first.');
        this.socket.emit(event, payload);
    }

    _trigger(event, payload) {
        (this._handlers[event] || []).forEach((h) => h(payload));
    }

    // ── Internal socket event wiring ─────────────────────────────────────────

    _wireSocketEvents() {
        // Participant events
        this.socket.on('participant-joined', (p) => this._trigger('participant-joined', p));
        this.socket.on('participant-left',   (p) => this._trigger('participant-left', p));

        // Messages
        this.socket.on('message-received', (message) => {
            // Auto-ack delivery if we are the receiver and currently connected
            if (message.receiverId === this.userId && message.status !== 'delivered') {
                this.acknowledgeDelivered(message.id, message.roomId);
            }
            this._trigger('message', message);
        });

        this.socket.on('message-status', (update) => {
            this._trigger('message-status', update);
        });

        this.socket.on('room-read', (payload) => {
            this._trigger('room-read', payload);
        });

        this.socket.on('message-error', (err) => {
            this._trigger('message-error', err);
        });

        // Typing
        this.socket.on('user-typing',      (p) => this._trigger('typing-start', p));
        this.socket.on('user-stop-typing', (p) => this._trigger('typing-stop', p));

        // Presence
        this.socket.on('presence-changed', (p) => {
            if (p.userId === this.userId) return; // ignore own presence echo
            if (p.status === PRESENCE.ONLINE) this._trigger('user-online', p);
            if (p.status === PRESENCE.OFFLINE) this._trigger('user-offline', p);
            if (p.status === PRESENCE.AWAY) this._trigger('user-away', p);
            this._trigger('presence-changed', p);
        });

        this.socket.on('presence-list', (list) => this._trigger('presence-list', list));

        // Connection
        this.socket.on('disconnect', () => this._trigger('disconnected', {}));
        this.socket.on('connect',    () => this._trigger('connected', {}));
        this.socket.on('error',      (e) => this._trigger('error', e));
    }
}
