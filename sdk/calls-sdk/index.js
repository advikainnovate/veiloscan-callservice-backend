import CallManager from "./callManager.js";

export default class CallSDK {
  constructor(config) {
    this.manager =
      new CallManager(config);
  }

  connect() {
    return this.manager.connect();
  }

  call(userId) {
    return this.manager.startCall(userId);
  }

  on(event, callback) {
    this.manager.on(event, callback);
  }
}