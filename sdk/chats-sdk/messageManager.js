export default class MessageManager {
    constructor(socket) {
        this.socket = socket;
    }

    sendMessage({ roomId, userId, senderId, receiverId, message, text }) {
        this.socket.emit('send-message', {
            roomId,
            userId: userId || senderId,
            receiverId,
            message: message || text,
        });
    }

    typing({ roomId, userId }) {
        this.socket.emit('typing', {
            roomId,
            userId,
        });
    }

    stopTyping({ roomId, userId }) {
        this.socket.emit('stop-typing', {
            roomId,
            userId,
        });
    }

    onMessage(callback) {
        this.socket.on('message-received', callback);
    }

    onTyping(callback) {
        this.socket.on('user-typing', callback);
    }

    onStopTyping(callback) {
        this.socket.on('user-stop-typing', callback);
    }
}
