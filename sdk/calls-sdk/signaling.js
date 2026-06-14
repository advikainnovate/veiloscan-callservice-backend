export default class Signaling {
  constructor(socketUrl) {
    this.socketUrl = socketUrl;
    this.socket = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.socketUrl);

      this.socket.onopen = () => resolve();

      this.socket.onerror = reject;
    });
  }

  send(event, payload) {
    this.socket.send(
      JSON.stringify({
        event,
        payload,
      })
    );
  }

  on(callback) {
    this.socket.onmessage = (message) => {
      callback(JSON.parse(message.data));
    };
  }
}