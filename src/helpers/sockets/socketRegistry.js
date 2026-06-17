class SocketRegistry {
    constructor() {
        this.userSockets = new Map();
        this.socketUsers = new Map();
    }

    register(userId, socketId) {
        this.userSockets.set(userId, socketId);

        this.socketUsers.set(socketId, userId);
    }

    unregister(socketId) {
        const userId = this.socketUsers.get(socketId);

        if (!userId) return;

        this.userSockets.delete(userId);

        this.socketUsers.delete(socketId);
    }

    getSocketId(userId) {
        return this.userSockets.get(userId);
    }

    getUserId(socketId) {
        return this.socketUsers.get(socketId);
    }

    isOnline(userId) {
        return this.userSockets.has(userId);
    }
}

module.exports = new SocketRegistry();
