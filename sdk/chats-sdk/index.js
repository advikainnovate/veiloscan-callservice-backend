import ChatManager, { PRESENCE, MESSAGE_STATUS, ROOM_STATUS } from './chatManager.js';

export class ChatSDK {
  constructor(config) {
    this.manager = new ChatManager(config);
  }

  connect() { return this.manager.connect(); }
  disconnect() { return this.manager.disconnect(); }
  joinRoom(roomId) { return this.manager.joinRoom(roomId); }
  leaveRoom(roomId) { return this.manager.leaveRoom(roomId); }
  sendMessage(payload) { return this.manager.sendMessage(payload); }
  acknowledgeDelivered(messageId, roomId) { return this.manager.acknowledgeDelivered(messageId, roomId); }
  markRead(messageId, roomId) { return this.manager.markRead(messageId, roomId); }
  markRoomRead(roomId) { return this.manager.markRoomRead(roomId); }
  startTyping(roomId) { return this.manager.startTyping(roomId); }
  stopTyping(roomId) { return this.manager.stopTyping(roomId); }
  setPresence(status) { return this.manager.setPresence(status); }
  getPresence(userIds) { return this.manager.getPresence(userIds); }
  on(event, callback) { return this.manager.on(event, callback); }
  off(event, callback) { return this.manager.off(event, callback); }
}

export { ChatManager, PRESENCE, MESSAGE_STATUS, ROOM_STATUS };
export default ChatSDK;
