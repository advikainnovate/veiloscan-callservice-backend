import CallManager from './callManager.js';

export default class CallSDK {
    constructor(config) {
        this.manager = new CallManager(config);
    }

    connect() {
        return this.manager.connect();
    }

    joinSession(sessionId) {
        return this.manager.joinSession(sessionId);
    }

    leaveSession() {
        return this.manager.leaveSession();
    }

    endCall() {
        return this.manager.endCall();
    }

    on(event, callback) {
        this.manager.on(event, callback);
    }
}
