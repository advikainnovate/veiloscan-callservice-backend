const socketRegistry = require('./socketRegistry');

// userId → Set<socket> (supports multiple tabs / devices per user)
const socketObjects = new Map();

module.exports = {
    registerSocket(socket, userId) {
        socket.userId = userId;
        socketRegistry.register(userId, socket.id);

        if (!socketObjects.has(userId)) {
            socketObjects.set(userId, new Set());
        }
        socketObjects.get(userId).add(socket);
    },

    removeSocket(socket) {
        if (socket.userId) {
            const sockets = socketObjects.get(socket.userId);
            if (sockets) {
                sockets.delete(socket);
                if (sockets.size === 0) {
                    socketObjects.delete(socket.userId);
                }
            }
        }
        socketRegistry.unregister(socket.id);
    },

    /**
     * Get one live socket for a userId (first/most recent connection).
     * Returns null if the user is not connected.
     */
    getSocket(userId) {
        const sockets = socketObjects.get(userId);
        if (!sockets || sockets.size === 0) return null;
        return sockets.values().next().value;
    },

    /**
     * Get all live sockets for a userId (e.g. multi-tab).
     * Returns an empty array if not connected.
     */
    getSockets(userId) {
        const sockets = socketObjects.get(userId);
        return sockets ? [...sockets] : [];
    },

    isOnline(userId) {
        const sockets = socketObjects.get(userId);
        return !!(sockets && sockets.size > 0);
    },

    getSocketId(userId) {
        return socketRegistry.getSocketId(userId);
    },
};
