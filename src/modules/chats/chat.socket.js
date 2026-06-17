const chatService = require('./chat.service');
const roomManager = require('../../helpers/sockets/roomManager');
const connectionManager = require('../../helpers/sockets/connectionManager');
const db = require('../../database/models');
module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log(`Chat Socket Connected: ${socket.id}`);

        /**
         * JOIN CHAT ROOM
         */
        socket.on('join-room', async ({ roomId, userId }) => {
            try {
                if (!roomId) {
                    return;
                }

                if (userId) {
                    connectionManager.registerSocket(socket, userId);
                }

                roomManager.joinRoom(roomId, socket.id);

                socket.chatRooms = socket.chatRooms || new Set();
                socket.chatRooms.add(roomId);
                socket.join(roomId);
                // Increment chat request count for the organization if authenticated
                if (socket.organizationId) {
                    await db.Organization.increment('chatRequestsCount', { by: 1, where: { id: socket.organizationId } });
                }

                io.to(roomId).emit('participant-joined', {
                    socketId: socket.id,
                });
            } catch (error) {
                console.error('join-room error', error);
                socket.emit('error', { message: 'Unable to join chat room' });
            }
        });

        /**
         * SEND MESSAGE
         */
        socket.on('send-message', async (payload) => {
            try {
                const message = await chatService.saveMessage(payload);

                io.to(payload.roomId).emit('message-received', message);
            } catch (error) {
                console.error('send-message', error);

                socket.emit('message-error', {
                    roomId: payload.roomId,
                    error: error.message || 'Failed to save message',
                });
            }
        });

        /**
         * TYPING
         */
        socket.on('typing', ({ roomId, userId }) => {
            socket.to(roomId).emit('user-typing', {
                userId,
            });
        });

        /**
         * STOP TYPING
         */
        socket.on('stop-typing', ({ roomId, userId }) => {
            socket.to(roomId).emit('user-stop-typing', {
                userId,
            });
        });

        /**
         * LEAVE ROOM
         */
        socket.on('leave-room', ({ roomId }) => {
            if (!roomId) {
                return;
            }

            const participants = roomManager.leaveRoom(roomId, socket.id);

            if (socket.chatRooms) {
                socket.chatRooms.delete(roomId);
            }

            socket.leave(roomId);

            io.to(roomId).emit('participant-left', {
                socketId: socket.id,
                participants,
            });
        });

        socket.on('disconnect', () => {
            if (socket.chatRooms) {
                socket.chatRooms.forEach((roomId) => {
                    const participants = roomManager.leaveRoom(roomId, socket.id);

                    io.to(roomId).emit('participant-left', {
                        socketId: socket.id,
                        participants,
                    });
                });
            }

            connectionManager.removeSocket(socket);

            console.log(`Chat Socket Disconnected: ${socket.id}`);
        });
    });
};
