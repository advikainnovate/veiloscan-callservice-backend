const callService = require('./call.session.service');
const roomManager = require('../../helpers/sockets/roomManager');
const connectionManager = require('../../helpers/sockets/connectionManager');
const db = require('../../database/models');

// Per-session state: timers, reconnection, ringing
const sessionState = new Map();

const getSessionState = (sessionId) => {
    if (!sessionState.has(sessionId)) {
        sessionState.set(sessionId, {
            reconnectTimer: null,
            heartbeatInterval: null,
            ringTimer: null,
            pausedAt: null,
            disconnectedParticipants: new Set(),
            callerId: null,
            calleeId: null,
        });
    }
    return sessionState.get(sessionId);
};

const clearSessionTimers = (sessionId) => {
    const state = sessionState.get(sessionId);
    if (state) {
        if (state.reconnectTimer)   clearTimeout(state.reconnectTimer);
        if (state.heartbeatInterval) clearInterval(state.heartbeatInterval);
        if (state.ringTimer)        clearTimeout(state.ringTimer);
        sessionState.delete(sessionId);
    }
};

const startHeartbeat = (io, sessionId) => {
    const state = getSessionState(sessionId);
    if (state.heartbeatInterval) clearInterval(state.heartbeatInterval);
    state.heartbeatInterval = setInterval(() => {
        io.to(sessionId).emit('ping');
    }, 5000);
};

const startReconnectionTimer = (io, sessionId) => {
    const state = getSessionState(sessionId);
    if (state.reconnectTimer) clearTimeout(state.reconnectTimer);

    state.reconnectTimer = setTimeout(async () => {
        try {
            if (roomManager.getRoomSize(sessionId) === 0) {
                io.to(sessionId).emit('call-ended', { reason: 'reconnection-timeout' });
                await callService.endSession(sessionId);
                clearSessionTimers(sessionId);
                console.log(`[Call] ${sessionId} auto-ended — reconnection timeout`);
            }
        } catch (err) {
            console.error('[Call] reconnection timeout handler error', err);
        }
    }, 30000);
};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        // ── HEARTBEAT ──────────────────────────────────────────────────────────
        socket.on('pong', () => { /* alive */ });

        // ── INITIATE CALL (caller flow) ────────────────────────────────────────
        // Caller tells platform: "I want to call calleeId in sessionId"
        // Platform forwards incoming-call to the callee's socket
        socket.on('initiate-call', async ({ sessionId, callerId, calleeId }) => {
            try {
                if (!sessionId || !calleeId) {
                    return socket.emit('error', { message: 'sessionId and calleeId required' });
                }

                const state = getSessionState(sessionId);
                state.callerId = callerId;
                state.calleeId = calleeId;

                // Find the callee's socket and send the ringing event
                const calleeSocket = connectionManager.getSocket(calleeId);
                if (!calleeSocket) {
                    return socket.emit('call-failed', {
                        reason: 'user-unavailable',
                        sessionId,
                    });
                }

                calleeSocket.emit('incoming-call', {
                    sessionId,
                    callerId,
                    calleeId,
                });

                // Ring timeout — 45s, callee didn't answer
                state.ringTimer = setTimeout(() => {
                    socket.emit('call-timeout', { sessionId, reason: 'no-answer' });
                    calleeSocket.emit('call-ended', { sessionId, reason: 'caller-timeout' });
                    clearSessionTimers(sessionId);
                    console.log(`[Call] ${sessionId} timed out — no answer from ${calleeId}`);
                }, 45000);

                console.log(`[Call] ${sessionId} — ${callerId} ringing ${calleeId}`);
            } catch (err) {
                console.error('[Call] initiate-call error', err);
                socket.emit('error', { message: 'Unable to initiate call' });
            }
        });

        // ── ACCEPT CALL ────────────────────────────────────────────────────────
        socket.on('accept-call', ({ sessionId, calleeId }) => {
            try {
                const state = getSessionState(sessionId);

                // Cancel ring timer
                if (state.ringTimer) {
                    clearTimeout(state.ringTimer);
                    state.ringTimer = null;
                }

                // Notify caller that call was accepted — caller will join-session
                const callerSocket = connectionManager.getSocket(state.callerId);
                if (callerSocket) {
                    callerSocket.emit('call-accepted', { sessionId, calleeId });
                }

                console.log(`[Call] ${sessionId} accepted by ${calleeId}`);
            } catch (err) {
                console.error('[Call] accept-call error', err);
            }
        });

        // ── REJECT CALL ────────────────────────────────────────────────────────
        socket.on('reject-call', ({ sessionId, calleeId }) => {
            try {
                const state = getSessionState(sessionId);

                if (state.ringTimer) {
                    clearTimeout(state.ringTimer);
                    state.ringTimer = null;
                }

                // Notify caller
                const callerSocket = connectionManager.getSocket(state.callerId);
                if (callerSocket) {
                    callerSocket.emit('call-rejected', { sessionId, calleeId });
                }

                clearSessionTimers(sessionId);
                console.log(`[Call] ${sessionId} rejected by ${calleeId}`);
            } catch (err) {
                console.error('[Call] reject-call error', err);
            }
        });

        // ── JOIN SESSION ───────────────────────────────────────────────────────
        socket.on('join-session', async ({ sessionId, userId }) => {
            try {
                if (!sessionId) {
                    return socket.emit('error', { message: 'Session ID required' });
                }

                if (userId) {
                    connectionManager.registerSocket(socket, userId);
                }

                const participants = roomManager.getRoomSize(sessionId);
                if (participants >= 2) {
                    return socket.emit('room-full', { sessionId });
                }

                const roomSize = roomManager.joinRoom(sessionId, socket.id);
                socket.join(sessionId);
                socket.sessionId = sessionId;

                // Track usage
                if (socket.organizationId) {
                    await db.Organization.increment('callRequestsCount', {
                        by: 1,
                        where: { id: socket.organizationId },
                    });
                }

                // Resume if rejoining during reconnection window
                const state = getSessionState(sessionId);
                if (state.reconnectTimer) {
                    clearTimeout(state.reconnectTimer);
                    state.reconnectTimer = null;
                    state.pausedAt = null;
                    state.disconnectedParticipants.delete(socket.id);
                    await callService.resumeSession(sessionId);
                    io.to(sessionId).emit('call-resumed');
                    console.log(`[Call] ${sessionId} resumed`);
                }

                io.to(sessionId).emit('participant-joined', {
                    socketId: socket.id,
                    participants: roomSize,
                });

                if (roomSize === 2) {
                    await callService.activateSession(sessionId);
                    startHeartbeat(io, sessionId);
                    io.to(sessionId).emit('call-started');
                    console.log(`[Call] ${sessionId} started`);
                }
            } catch (err) {
                console.error('[Call] join-session error', err);
                socket.emit('error', { message: 'Unable to join session' });
            }
        });

        // ── WebRTC SIGNALING ───────────────────────────────────────────────────
        socket.on('offer', (data) => {
            socket.to(data.sessionId).emit('offer', data);
        });

        socket.on('answer', (data) => {
            socket.to(data.sessionId).emit('answer', data);
        });

        socket.on('ice-candidate', (data) => {
            socket.to(data.sessionId).emit('ice-candidate', data);
        });

        // ── MUTE / VIDEO RELAY ─────────────────────────────────────────────────
        // Relay control state changes to the other peer
        socket.on('mute-changed', (data) => {
            socket.to(data.sessionId).emit('mute-changed', data);
        });

        socket.on('video-changed', (data) => {
            socket.to(data.sessionId).emit('video-changed', data);
        });

        // ── END CALL ───────────────────────────────────────────────────────────
        socket.on('end-call', async ({ sessionId }) => {
            try {
                // Emit to room FIRST — everyone still in room receives it
                io.to(sessionId).emit('call-ended', {
                    reason: 'user-ended',
                    endedBy: socket.id,
                });

                roomManager.leaveRoom(sessionId, socket.id);
                socket.leave(sessionId);
                clearSessionTimers(sessionId);

                try {
                    await callService.endSession(sessionId);
                } catch (dbErr) {
                    console.error('[Call] end-call DB update failed (non-fatal):', dbErr.message);
                }

                console.log(`[Call] ${sessionId} ended by ${socket.id}`);
            } catch (err) {
                console.error('[Call] end-call error', err);
                socket.emit('error', { message: 'Unable to end call' });
            }
        });

        // ── LEAVE SESSION (reconnectable) ──────────────────────────────────────
        socket.on('leave-session', async ({ sessionId }) => {
            try {
                await leaveRoom(io, socket, sessionId);
            } catch (err) {
                console.error('[Call] leave-session error', err);
            }
        });

        // ── DISCONNECT ─────────────────────────────────────────────────────────
        socket.on('disconnect', async () => {
            try {
                if (socket.sessionId) {
                    await leaveRoom(io, socket, socket.sessionId);
                }
                connectionManager.removeSocket(socket);
                console.log(`[Socket] Disconnected: ${socket.id}`);
            } catch (err) {
                console.error('[Call] disconnect error', err);
            }
        });
    });
};

/**
 * Handle a participant leaving with 30s reconnection window.
 * If peer is still in room → pause + start timer.
 * If room empty → end immediately.
 */
async function leaveRoom(io, socket, sessionId) {
    try {
        const participants = roomManager.leaveRoom(sessionId, socket.id);
        socket.leave(sessionId);

        io.to(sessionId).emit('participant-left', {
            socketId: socket.id,
            participants,
            canReconnect: participants > 0,
        });

        if (participants > 0) {
            // Peer still connected — pause and open reconnection window
            await callService.pauseSession(sessionId);

            const state = getSessionState(sessionId);
            state.pausedAt = new Date();
            state.disconnectedParticipants.add(socket.id);

            io.to(sessionId).emit('call-paused', {
                reason: 'participant-disconnected',
                disconnectedSocketId: socket.id,
                reconnectTimeoutSeconds: 30,
            });

            startReconnectionTimer(io, sessionId);
            console.log(`[Call] ${sessionId} paused — waiting for reconnection`);
        } else {
            // Everyone left — end the session
            io.to(sessionId).emit('call-ended', { reason: 'all-participants-left' });

            try {
                await callService.endSession(sessionId);
            } catch (_) { /* session may not exist in DB */ }

            clearSessionTimers(sessionId);
            console.log(`[Call] ${sessionId} ended — all participants left`);
        }
    } catch (err) {
        console.error('[Call] leaveRoom error', err);
    }
}
