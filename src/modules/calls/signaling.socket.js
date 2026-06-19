const callService = require('./call.session.service');
const roomManager = require('../../helpers/sockets/roomManager');
const connectionManager = require('../../helpers/sockets/connectionManager');
const db = require('../../database/models');
// Session state management: track reconnection timers and metadata
const sessionState = new Map();

/**
 * Track reconnection windows and timers per session
 */
const getSessionState = (sessionId) => {
    if (!sessionState.has(sessionId)) {
        sessionState.set(sessionId, {
            reconnectTimer: null,
            heartbeatInterval: null,
            pausedAt: null,
            disconnectedParticipants: new Set(),
        });
    }
    return sessionState.get(sessionId);
};

/**
 * Clear all timers for a session
 */
const clearSessionTimers = (sessionId) => {
    const state = sessionState.get(sessionId);
    if (state) {
        if (state.reconnectTimer) {
            clearTimeout(state.reconnectTimer);
            state.reconnectTimer = null;
        }
        if (state.heartbeatInterval) {
            clearInterval(state.heartbeatInterval);
            state.heartbeatInterval = null;
        }
        sessionState.delete(sessionId);
    }
};

/**
 * Start heartbeat: ping all participants every 5s
 */
const startHeartbeat = (io, sessionId) => {
    const state = getSessionState(sessionId);

    if (state.heartbeatInterval) {
        clearInterval(state.heartbeatInterval);
    }

    state.heartbeatInterval = setInterval(() => {
        io.to(sessionId).emit('ping');
    }, 5000);
};

/**
 * Start reconnection timer: 30s window to rejoin before auto-ending
 */
const startReconnectionTimer = (io, sessionId) => {
    const state = getSessionState(sessionId);

    if (state.reconnectTimer) {
        clearTimeout(state.reconnectTimer);
    }

    const RECONNECTION_TIMEOUT = 30000; // 30 seconds

    state.reconnectTimer = setTimeout(async () => {
        try {
            const roomSize = roomManager.getRoomSize(sessionId);

            // If still empty after timeout, end the session
            if (roomSize === 0) {
                await callService.endSession(sessionId);
                io.to(sessionId).emit('call-ended', {
                    reason: 'reconnection-timeout',
                });
                clearSessionTimers(sessionId);
                console.log(`Session ${sessionId} auto-ended due to reconnection timeout`);
            }
        } catch (error) {
            console.error('Error in reconnection timeout handler', error);
        }
    }, RECONNECTION_TIMEOUT);
};

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`Socket Connected: ${socket.id}`);

        /**
         * HEARTBEAT RESPONSE: pong
         */
        socket.on('pong', () => {
            // Socket is alive
        });

        /**
         * JOIN SESSION
         */
        socket.on('join-session', async ({ sessionId, userId }) => {
            try {
                if (!sessionId) {
                    return socket.emit('error', {
                        message: 'Session ID required',
                    });
                }

                if (userId) {
                    connectionManager.registerSocket(socket, userId);
                }

                const participants = roomManager.getRoomSize(sessionId);

                if (participants >= 2) {
                    return socket.emit('room-full', {
                        sessionId,
                    });
                }

                const roomSize = roomManager.joinRoom(sessionId, socket.id);

                socket.join(sessionId);
                socket.sessionId = sessionId;
        // Increment call request count for the organization if authenticated
        if (socket.organizationId) {
            await db.Organization.increment('callRequestsCount', { by: 1, where: { id: socket.organizationId } });
        }

                // If rejoining during paused state, resume call
                const state = getSessionState(sessionId);
                if (state.reconnectTimer) {
                    clearTimeout(state.reconnectTimer);
                    state.reconnectTimer = null;
                    state.pausedAt = null;
                    state.disconnectedParticipants.delete(socket.id);

                    await callService.resumeSession(sessionId);
                    io.to(sessionId).emit('call-resumed');
                    console.log(`Session ${sessionId} resumed after reconnection`);
                }

                io.to(sessionId).emit('participant-joined', {
                    socketId: socket.id,
                    participants: roomSize,
                });

                /**
                 * Call officially starts when second participant joins
                 */
                if (roomSize === 2) {
                    await callService.activateSession(sessionId);
                    startHeartbeat(io, sessionId);
                    io.to(sessionId).emit('call-started');
                }
            } catch (error) {
                console.error('join-session error', error);
                socket.emit('error', {
                    message: 'Unable to join room',
                });
            }
        });

        /**
         * OFFER: ICE negotiation
         */
        socket.on('offer', (data) => {
            socket.to(data.sessionId).emit('offer', data);
        });

        /**
         * ANSWER: ICE negotiation
         */
        socket.on('answer', (data) => {
            socket.to(data.sessionId).emit('answer', data);
        });

        /**
         * ICE CANDIDATE: ICE negotiation
         */
        socket.on('ice-candidate', (data) => {
            socket.to(data.sessionId).emit('ice-candidate', data);
        });

        /**
         * END CALL: Explicit end by user (not just disconnect)
         * This marks the call as ended immediately, no reconnection window
         */
        socket.on('end-call', async ({ sessionId }) => {
            try {
                // Notify all participants FIRST — before leaving the room
                io.to(sessionId).emit('call-ended', {
                    reason: 'user-ended',
                    endedBy: socket.id,
                });

                // Clean up room
                roomManager.leaveRoom(sessionId, socket.id);
                socket.leave(sessionId);
                clearSessionTimers(sessionId);

                // Update DB — best effort, don't let failure block the end
                try {
                    await callService.endSession(sessionId);
                } catch (dbErr) {
                    console.error('end-call DB update failed (non-fatal):', dbErr.message);
                }

                console.log(`Session ${sessionId} ended by user ${socket.id}`);
            } catch (error) {
                console.error('end-call error', error);
                socket.emit('error', {
                    message: 'Unable to end call',
                });
            }
        });

        /**
         * MANUAL LEAVE: Participant manually leaves (not intentional end)
         * This triggers reconnection window
         */
        socket.on('leave-session', async ({ sessionId }) => {
            try {
                await leaveRoom(io, socket, sessionId);
            } catch (err) {
                console.error('leave-session error', err);
            }
        });

        /**
         * DISCONNECT: Handle unexpected disconnection
         * This also triggers reconnection window
         */
        socket.on('disconnect', async () => {
            try {
                if (socket.sessionId) {
                    await leaveRoom(io, socket, socket.sessionId);
                }

                connectionManager.removeSocket(socket);
                console.log(`Socket Disconnected: ${socket.id}`);
            } catch (err) {
                console.error('disconnect error', err);
            }
        });
    });
};

/**
 * ROOM CLEANUP: Handle participant leaving (with reconnection window)
 *
 * When a participant leaves (either via leave-session or disconnect):
 * 1. If 2 participants → pause call, start 30s reconnection window
 * 2. If 1 participant left → participant can still rejoin within 30s
 * 3. If reconnection timer expires → end session
 * 4. If participant explicitly calls end-call → skip this, end immediately
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

        // If any participants remain, pause and wait for reconnection
        if (participants > 0) {
            try {
                await callService.pauseSession(sessionId);

                const state = getSessionState(sessionId);
                state.pausedAt = new Date();
                state.disconnectedParticipants.add(socket.id);

                io.to(sessionId).emit('call-paused', {
                    reason: 'participant-disconnected',
                    disconnectedSocketId: socket.id,
                    reconnectTimeoutSeconds: 30,
                });

                // Start reconnection timer
                startReconnectionTimer(io, sessionId);

                console.log(`Session ${sessionId} paused, waiting for reconnection (${participants} still connected)`);
            } catch (error) {
                console.error('Error pausing session', error);
            }
        } else {
            // All participants left, end the session
            try {
                await callService.endSession(sessionId);
                io.to(sessionId).emit('call-ended', {
                    reason: 'all-participants-left',
                });
                clearSessionTimers(sessionId);

                console.log(`Session ${sessionId} ended - all participants disconnected`);
            } catch (error) {
                console.error('Failed to end session', error);
            }
        }
    } catch (error) {
        console.error('leaveRoom error', error);
    }
}
