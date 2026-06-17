import MessageManager from './messageManager.js';

export default class ChatManager {
    constructor(socket) {
        this.socket = socket;
        this.messages = new MessageManager(socket);
    }

    joinRoom(roomId, userId) {
        this.socket.emit('join-room', {
            roomId,
            userId,
        });
    }

    leaveRoom(roomId) {
        this.socket.emit('leave-room', {
            roomId,
        });
    }

    onParticipantJoined(callback) {
        this.socket.on('participant-joined', callback);
    }

    onParticipantLeft(callback) {
        this.socket.on('participant-left', callback);
    }

    sendMessage(payload) {
        this.messages.sendMessage(payload);
    }

    typing(payload) {
        this.messages.typing(payload);
    }

    stopTyping(payload) {
        this.messages.stopTyping(payload);
    }

    onMessage(callback) {
        this.messages.onMessage(callback);
    }

    onTyping(callback) {
        this.messages.onTyping(callback);
    }

    onStopTyping(callback) {
        this.messages.onStopTyping(callback);
    }
}
