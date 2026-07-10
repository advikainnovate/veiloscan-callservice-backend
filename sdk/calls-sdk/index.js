import CallManager from './callManager.js';
import { CALL_STATUS, EVENTS, QUALITY } from './constants.js';

export class CallSDK {
    constructor(config) {
        this.manager = new CallManager(config);
    }

    // ── Connection ───────────────────────────────────────────────────────────
    connect() { return this.manager.connect(); }

    // ── Session ──────────────────────────────────────────────────────────────
    joinSession(sessionId)                      { return this.manager.joinSession(sessionId); }
    initiateCall(sessionId, calleeUserId)       { return this.manager.initiateCall(sessionId, calleeUserId); }
    acceptCall(sessionId)                       { return this.manager.acceptCall(sessionId); }
    rejectCall(sessionId)                       { return this.manager.rejectCall(sessionId); }
    leaveSession()                              { return this.manager.leaveSession(); }
    endCall()                                   { return this.manager.endCall(); }

    // ── Controls ─────────────────────────────────────────────────────────────
    setMuted(muted)                             { return this.manager.setMuted(muted); }
    isMuted()                                   { return this.manager.isMuted(); }
    setVideoEnabled(enabled)                    { return this.manager.setVideoEnabled(enabled); }
    isVideoEnabled()                            { return this.manager.isVideoEnabled(); }

    // ── Info ─────────────────────────────────────────────────────────────────
    getStatus()                                 { return this.manager.status; }
    getCallDuration()                           { return this.manager.getCallDuration(); }

    // ── Events ───────────────────────────────────────────────────────────────
    on(event, callback)                         { this.manager.on(event, callback); }
    off(event, callback)                        { this.manager.off(event, callback); }
}

export { CallManager, CALL_STATUS, EVENTS, QUALITY };
export default CallSDK;
