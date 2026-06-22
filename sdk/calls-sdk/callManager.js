import EventEmitter from './EventEmitter.js';
import Signaling from './signaling.js';
import WebRTC from './webrtc.js';
import { CALL_STATUS, EVENTS } from './constants.js';

const RING_TIMEOUT_MS = 45000; // 45s — caller gives up if no answer

export default class CallManager extends EventEmitter {
    constructor(config) {
        super();

        this.userId    = config.userId || `user-${Math.random().toString(36).substring(2, 8)}`;
        this.apiKey    = config.apiKey;
        this.socketUrl = config.socketUrl;
        this.audio     = config.audio !== false;
        this.video     = config.video === true;
        this.iceServers = config.iceServers || [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
        ];

        this.signaling   = new Signaling(this.socketUrl, this.apiKey);
        this.webrtc      = null;
        this.sessionId   = null;
        this.isInitiator = false;
        this.status      = CALL_STATUS.IDLE;

        // internal timers
        this._ringTimer    = null;
        this._startTime    = null;
        this._durationTimer = null;
    }

    // ─── Status ──────────────────────────────────────────────────────────────

    _setStatus(status) {
        this.status = status;
        this.emit(EVENTS.STATUS_CHANGED, { status });
    }

    // ─── Connect ─────────────────────────────────────────────────────────────

    async connect() {
        await this.signaling.connect();
        this._listen();
    }

    // ─── Join session (callee or direct join) ────────────────────────────────

    async joinSession(sessionId) {
        if (!this.signaling.socket) await this.connect();
        this.sessionId = sessionId;
        this._setStatus(CALL_STATUS.CONNECTING);
        this.signaling.send('join-session', { sessionId, userId: this.userId });
        this.emit(EVENTS.JOINED_SESSION, { sessionId });
    }

    // ─── Initiate call (caller flow) ─────────────────────────────────────────

    async initiateCall(sessionId, calleeUserId) {
        if (!this.signaling.socket) await this.connect();
        this.sessionId   = sessionId;
        this.isInitiator = true;
        this._setStatus(CALL_STATUS.RINGING);

        this.signaling.send('initiate-call', {
            sessionId,
            callerId: this.userId,
            calleeId: calleeUserId,
        });

        // Ring timeout — give up if no answer in 45s
        this._ringTimer = setTimeout(() => {
            this.emit(EVENTS.CALL_TIMEOUT, { sessionId });
            this._setStatus(CALL_STATUS.ENDED);
            this._cleanup();
        }, RING_TIMEOUT_MS);
    }

    // ─── Accept incoming call ────────────────────────────────────────────────

    acceptCall(sessionId) {
        this.sessionId = sessionId;
        this.signaling.send('accept-call', { sessionId, calleeId: this.userId });
        this._setStatus(CALL_STATUS.CONNECTING);
    }

    // ─── Reject incoming call ────────────────────────────────────────────────

    rejectCall(sessionId) {
        this.signaling.send('reject-call', { sessionId, calleeId: this.userId });
        this._setStatus(CALL_STATUS.ENDED);
    }

    // ─── End call ────────────────────────────────────────────────────────────

    async endCall() {
        if (this.sessionId) {
            this.signaling.send('end-call', { sessionId: this.sessionId });
            this._cleanup();
            this._setStatus(CALL_STATUS.ENDED);
            this.sessionId = null;
        }
    }

    // ─── Leave session (reconnectable) ───────────────────────────────────────

    async leaveSession() {
        if (this.sessionId) {
            this.signaling.send('leave-session', { sessionId: this.sessionId });
            this._cleanupWebRTC();
            this.sessionId = null;
        }
    }

    // ─── Mute / Unmute ───────────────────────────────────────────────────────

    setMuted(muted) {
        if (this.webrtc) {
            this.webrtc.setAudioEnabled(!muted);
            this.emit(EVENTS.MUTE_CHANGED, { muted });
            this.signaling.send('mute-changed', {
                sessionId: this.sessionId,
                userId: this.userId,
                muted,
            });
        }
    }

    isMuted() {
        return this.webrtc ? !this.webrtc.isAudioEnabled() : true;
    }

    // ─── Camera On / Off ─────────────────────────────────────────────────────

    setVideoEnabled(enabled) {
        if (this.webrtc) {
            this.webrtc.setVideoEnabled(enabled);
            this.emit(EVENTS.VIDEO_CHANGED, { videoEnabled: enabled });
            this.signaling.send('video-changed', {
                sessionId: this.sessionId,
                userId: this.userId,
                videoEnabled: enabled,
            });
        }
    }

    isVideoEnabled() {
        return this.webrtc ? this.webrtc.isVideoEnabled() : false;
    }

    // ─── Duration ────────────────────────────────────────────────────────────

    getCallDuration() {
        if (!this._startTime) return 0;
        return Math.floor((Date.now() - this._startTime) / 1000);
    }

    // ─── Socket event listeners ───────────────────────────────────────────────

    _listen() {
        // ── Incoming call (callee receives this) ──
        this.signaling.on('incoming-call', (payload) => {
            this._setStatus(CALL_STATUS.RINGING);
            this.emit(EVENTS.INCOMING_CALL, payload);
        });

        // ── Caller notified callee accepted ──
        this.signaling.on('call-accepted', (payload) => {
            clearTimeout(this._ringTimer);
            this._ringTimer = null;
            this._setStatus(CALL_STATUS.CONNECTING);
            this.emit(EVENTS.CALL_ACCEPTED, payload);
            // Caller joins the session room after acceptance
            this.signaling.send('join-session', {
                sessionId: payload.sessionId,
                userId: this.userId,
            });
        });

        // ── Caller notified callee rejected ──
        this.signaling.on('call-rejected', (payload) => {
            clearTimeout(this._ringTimer);
            this._ringTimer = null;
            this._setStatus(CALL_STATUS.ENDED);
            this.emit(EVENTS.CALL_REJECTED, payload);
            this._cleanup();
        });

        // ── Participant joined room ──
        this.signaling.on('participant-joined', (payload) => {
            this.emit(EVENTS.PARTICIPANT_JOINED, payload);
            const isMe = payload.socketId === this.signaling.socket.id;
            if (isMe) {
                this.isInitiator = payload.participants === 1;
            } else if (payload.participants === 2 && this.isInitiator) {
                this._startWebRTCOffer();
            }
        });

        // ── Participant left ──
        this.signaling.on('participant-left', (payload) => {
            this.emit(EVENTS.PARTICIPANT_LEFT, payload);
        });

        // ── Call started (both peers in room) ──
        this.signaling.on('call-started', () => {
            this._startTime = Date.now();
            this._setStatus(CALL_STATUS.CONNECTED);
            this.emit(EVENTS.CALL_STARTED);
        });

        // ── Call paused (reconnection window) ──
        this.signaling.on('call-paused', (payload) => {
            this._setStatus(CALL_STATUS.CONNECTING);
            this.emit(EVENTS.CALL_PAUSED, payload);
        });

        // ── Call resumed ──
        this.signaling.on('call-resumed', () => {
            this._setStatus(CALL_STATUS.CONNECTED);
            this.emit(EVENTS.CALL_RESUMED);
        });

        // ── Call ended ──
        this.signaling.on('call-ended', (payload) => {
            const duration = this.getCallDuration();
            this._setStatus(CALL_STATUS.ENDED);
            this.emit(EVENTS.CALL_ENDED, { ...payload, duration });
            this._cleanup();
        });

        // ── WebRTC signaling ──
        this.signaling.on('offer', async (data) => {
            this.emit('offer', data);
            await this._handleOffer(data);
        });

        this.signaling.on('answer', async (data) => {
            this.emit('answer', data);
            if (this.webrtc) {
                await this.webrtc.setRemoteDescription(new RTCSessionDescription(data.answer));
            }
        });

        this.signaling.on('ice-candidate', async (data) => {
            if (this.webrtc && data.candidate) {
                try {
                    await this.webrtc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (e) {
                    console.warn('ICE candidate error', e);
                }
            }
        });

        // ── Remote mute/video changes ──
        this.signaling.on('mute-changed', (payload) => {
            this.emit(EVENTS.MUTE_CHANGED, { ...payload, remote: true });
        });

        this.signaling.on('video-changed', (payload) => {
            this.emit(EVENTS.VIDEO_CHANGED, { ...payload, remote: true });
        });

        // ── Room full ──
        this.signaling.on('room-full', (payload) => {
            this._setStatus(CALL_STATUS.FAILED);
            this.emit(EVENTS.ROOM_FULL, payload);
        });
    }

    // ─── WebRTC: initiator sends offer ───────────────────────────────────────

    async _startWebRTCOffer() {
        try {
            this._cleanupWebRTC();
            this.webrtc = new WebRTC(this.iceServers);
            this._setupWebRTCEvents();

            const localStream = await this.webrtc.initialize(this.audio, this.video);
            this.emit(EVENTS.LOCAL_STREAM, localStream);

            const offer = await this.webrtc.createOffer();
            this.signaling.send('offer', {
                sessionId: this.sessionId,
                offer,
                senderId: this.userId,
            });
        } catch (err) {
            this._setStatus(CALL_STATUS.FAILED);
            this.emit(EVENTS.ERROR, err);
        }
    }

    // ─── WebRTC: receiver handles offer ──────────────────────────────────────

    async _handleOffer(data) {
        try {
            this.isInitiator = false;
            this._cleanupWebRTC();
            this.webrtc = new WebRTC(this.iceServers);
            this._setupWebRTCEvents();

            const localStream = await this.webrtc.initialize(this.audio, this.video);
            this.emit(EVENTS.LOCAL_STREAM, localStream);

            await this.webrtc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await this.webrtc.createAnswer();
            this.signaling.send('answer', {
                sessionId: this.sessionId,
                answer,
                senderId: this.userId,
            });
        } catch (err) {
            this._setStatus(CALL_STATUS.FAILED);
            this.emit(EVENTS.ERROR, err);
        }
    }

    // ─── WebRTC event wiring ─────────────────────────────────────────────────

    _setupWebRTCEvents() {
        this.webrtc.onIceCandidate((candidate) => {
            this.signaling.send('ice-candidate', {
                sessionId: this.sessionId,
                candidate,
                senderId: this.userId,
            });
        });

        this.webrtc.onRemoteStream((stream) => {
            this.emit(EVENTS.REMOTE_STREAM, stream);
        });

        this.webrtc.onIceStateChange((state) => {
            this.emit(EVENTS.CONNECTION_LOST, { state });
            if (state === 'failed') {
                this._setStatus(CALL_STATUS.FAILED);
            }
        });

        this.webrtc.startQualityMonitor(({ quality, rtt, lossRate }) => {
            this.emit(EVENTS.CONNECTION_QUALITY, { quality, rtt, lossRate });
        });
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────────

    _cleanupWebRTC() {
        if (this.webrtc) {
            this.webrtc.destroy();
            this.webrtc = null;
        }
    }

    _cleanup() {
        clearTimeout(this._ringTimer);
        this._ringTimer = null;
        this._startTime = null;
        this._cleanupWebRTC();
    }
}
