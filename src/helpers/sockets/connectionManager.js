const socketRegistry = require('./socketRegistry');

// userId → socket object (for direct emit)
const socketObjects = new Map();

module.exports = {
    registerSocket(socket, userId) {
        socket.userId = userId;
        socketRegistry.register(userId, socket.id);
        socketObjects.set(userId, socket);
    },

    removeSocket(socket) {
        if (socket.userId) {
            socketObjects.delete(socket.userId);
        }
        socketRegistry.unregister(socket.id);
    },

    /**
     * Get the live socket object for a userId.
     * Returns null if the user is not connected.
     */
    getSocket(userId) {
        return socketObjects.get(userId) || null;
    },

    isOnline(userId) {
        return socketRegistry.isOnline(userId);
    },

    getSocketId(userId) {
        return socketRegistry.getSocketId(userId);
    },
};
