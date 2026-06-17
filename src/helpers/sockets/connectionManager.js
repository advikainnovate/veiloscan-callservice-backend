const socketRegistry = require('./socketRegistry');

module.exports = {
    registerSocket(socket, userId) {
        socket.userId = userId;

        socketRegistry.register(userId, socket.id);
    },

    removeSocket(socket) {
        socketRegistry.unregister(socket.id);
    },
};
