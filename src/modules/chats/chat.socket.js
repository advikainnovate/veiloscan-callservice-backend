const chatService = require('./chat.service');
const roomManager = require('../../helpers/sockets/roomManager');
const connectionManager = require('../../helpers/sockets/connectionManager');
const db = require('../../database/models');

// userId → { status, lastSeen, away timer }
const presenceState = new Map();

const AWAY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes idle → away

const setPresence = (io, userId, status) => {
    const prev = presenceState.get(userId) || {};
    presenceState.set(userId, {
        ...prev,
        status,
        lastSeen: status === 'offline' ? new Date() : prev.lastSeen,
    });
    io.emit('presence-changed', { userId, status, lastSeen: presenceState.get(userId).lastSeen });
};

const startAwayTimer = (io, userId) => {
    const state = presenceState.get(userId) || {};
    if (state.awayTimer) clearTimeout(state.awayTimer);
    state.awayTimer = setTimeout(() => {
        const cur = presenceState.get(userId);
        if (cur && cur.status === 'online') {
            setPresence(io, userId, 'away');
        }
    }, AWAY_TIMEOUT_MS);
    presenceState.set(userId, { ...state });
};

const clearAwayTimer = (userId) => {
    const state = presenceState.get(userId);
    if (state?.awayTimer) {
        clearTimeout(state.awayTimer);
        presenceState.set(userId, { ...state, awayTimer: null });
    }
};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Chat] Socket connected: ${socket.id}`);

        // ── SET PRESENCE ─────────────────────────────────────────────────────
        socket.on('set-presence', ({ userId, status }) => {
            if (!userId) return;
            connectionManager.registerSocket(socket, userId);
            socket.userId = userId;

            const validStatus = ['online', 'away', 'offline'].includes(status) ? status : 'online';
            setPresence(io, userId, validStatus);

            if (validStatus === 'online') {
                startAwayTimer(io, userId);
            }

            console.log(`[Chat] ${userId} → ${validStatus}`);
        });

        // ── GET PRESENCE ──────────────────────────────────────────────────────
        socket.on('get-presence', ({ userIds }) => {
            if (!Array.isArray(userIds)) return;
            const result = userIds.map((uid) => {
                const state = presenceState.get(uid);
                return {
                    userId: uid,
                    status: state?.status || 'offline',
                    lastSeen: state?.lastSeen || null,
                };
            });
            socket.emit('presence-list', result);
        });

        // ── JOIN ROOM ─────────────────────────────────────────────────────────
        socket.on('join-room', async ({ roomId, userId }) => {
            try {
                if (!roomId) return;

                if (userId) {
                    connectionManager.registerSocket(socket, userId);
                    socket.userId = userId;
                    // Mark online when joining a room
                    if (!presenceState.get(userId)?.status || presenceState.get(userId)?.status === 'offline') {
                        setPresence(io, userId, 'online');
                    }
                    startAwayTimer(io, userId);
                }

                roomManager.joinRoom(roomId, socket.id);
                socket.chatRooms = socket.chatRooms || new Set();
                socket.chatRooms.add(roomId);
                socket.join(roomId);

                if (socket.organizationId) {
                    await db.Organization.increment('chatRequestsCount', {
                        by: 1,
                        where: { id: socket.organizationId },
                    });
                }

                io.to(roomId).emit('participant-joined', { socketId: socket.id, userId });

                // Sync missed messages since last seen
                // Clients can also call GET /rooms/:roomId/messages?before=<timestamp>
                console.log(`[Chat] ${userId || socket.id} joined room ${roomId}`);
            } catch (err) {
                console.error('[Chat] join-room error', err);
                socket.emit('error', { message: 'Unable to join room' });
            }
        });

        // ── SEND MESSAGE ──────────────────────────────────────────────────────
        socket.on('send-message', async (payload) => {
            try {
                // Reset away timer on activity
                if (socket.userId) startAwayTimer(io, socket.userId);

                const message = await chatService.saveMessage(payload);

                // Broadcast to room — sender gets it too (confirm sent)
                io.to(payload.roomId).emit('message-received', {
                    ...message.toJSON(),
                    status: 'sent',
                });

                // If receiver is online in the room → mark delivered immediately
                if (message.receiverId) {
                    const receiverSocket = connectionManager.getSocket(message.receiverId);
                    if (receiverSocket) {
                        const updated = await chatService.markDelivered(message.id);
                        io.to(payload.roomId).emit('message-status', {
                            messageId: message.id,
                            status: 'delivered',
                            deliveredAt: updated?.deliveredAt,
                        });
                    }
                }
            } catch (err) {
                console.error('[Chat] send-message error', err);
                socket.emit('message-error', {
                    roomId: payload.roomId,
                    error: err.message || 'Failed to save message',
                    status: 'failed',
                });
            }
        });

        // ── MESSAGE DELIVERED ACK ─────────────────────────────────────────────
        socket.on('message-delivered', async ({ messageId, roomId }) => {
            try {
                const message = await chatService.markDelivered(messageId);
                io.to(roomId).emit('message-status', {
                    messageId,
                    status: 'delivered',
                    deliveredAt: message?.deliveredAt,
                });
            } catch (err) {
                console.error('[Chat] message-delivered error', err);
            }
        });

        // ── READ RECEIPT ──────────────────────────────────────────────────────
        socket.on('message-read', async ({ messageId, roomId, userId }) => {
            try {
                if (socket.userId) startAwayTimer(io, socket.userId);

                const message = await chatService.markRead(messageId);

                // Notify the room (sender sees ✓✓ read)
                io.to(roomId).emit('message-status', {
                    messageId,
                    status: 'read',
                    readAt: message?.readAt,
                    readBy: userId,
                });
            } catch (err) {
                console.error('[Chat] message-read error', err);
            }
        });

        // ── MARK ROOM READ (bulk) ─────────────────────────────────────────────
        socket.on('room-read', async ({ roomId, userId }) => {
            try {
                await chatService.markRoomMessagesRead(roomId, userId);
                io.to(roomId).emit('room-read', { roomId, userId });
            } catch (err) {
                console.error('[Chat] room-read error', err);
            }
        });

        // ── TYPING ────────────────────────────────────────────────────────────
        socket.on('typing', ({ roomId, userId }) => {
            if (socket.userId) startAwayTimer(io, socket.userId);
            socket.to(roomId).emit('user-typing', { userId });
        });

        socket.on('stop-typing', ({ roomId, userId }) => {
            socket.to(roomId).emit('user-stop-typing', { userId });
        });

        // ── LEAVE ROOM ────────────────────────────────────────────────────────
        socket.on('leave-room', ({ roomId }) => {
            if (!roomId) return;
            const participants = roomManager.leaveRoom(roomId, socket.id);
            if (socket.chatRooms) socket.chatRooms.delete(roomId);
            socket.leave(roomId);
            io.to(roomId).emit('participant-left', {
                socketId: socket.id,
                userId: socket.userId,
                participants,
            });
            console.log(`[Chat] ${socket.userId || socket.id} left room ${roomId}`);
        });

        // ── DISCONNECT ────────────────────────────────────────────────────────
        socket.on('disconnect', () => {
            if (socket.chatRooms) {
                socket.chatRooms.forEach((roomId) => {
                    const participants = roomManager.leaveRoom(roomId, socket.id);
                    io.to(roomId).emit('participant-left', {
                        socketId: socket.id,
                        userId: socket.userId,
                        participants,
                    });
                });
            }

            if (socket.userId) {
                clearAwayTimer(socket.userId);
                setPresence(io, socket.userId, 'offline');
            }

            connectionManager.removeSocket(socket);
            console.log(`[Chat] Socket disconnected: ${socket.id}`);
        });
    });
};
