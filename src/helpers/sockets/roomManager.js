class RoomManager {
    constructor() {
        this.rooms = new Map();
    }

    createRoom(roomId) {
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }

        return this.rooms.get(roomId);
    }

    joinRoom(roomId, socketId) {
        this.createRoom(roomId);

        this.rooms.get(roomId).add(socketId);

        return this.rooms.get(roomId).size;
    }

    leaveRoom(roomId, socketId) {
        const room = this.rooms.get(roomId);

        if (!room) return 0;

        room.delete(socketId);

        if (room.size === 0) {
            this.rooms.delete(roomId);

            return 0;
        }

        return room.size;
    }

    getParticipants(roomId) {
        return this.rooms.get(roomId) || new Set();
    }

    roomExists(roomId) {
        return this.rooms.has(roomId);
    }

    getRoomSize(roomId) {
        const room = this.rooms.get(roomId);

        return room ? room.size : 0;
    }
}

module.exports = new RoomManager();
