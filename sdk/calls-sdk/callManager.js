import EventEmitter from './EventEmitter.js';
import Signaling from './signaling.js';
import WebRTC from './webrtc.js';
import { EVENTS } from './constants.js';

export default class CallManager extends EventEmitter {
    constructor(config) {
        super();

        this.userId = config.userId || `user-${Math.random().toString(36).substring(2, 8)}`;
        this.apiKey = config.apiKey;
        this.socketUrl = config.socketUrl;
        this.iceServers = config.iceServers || [{ urls: 'stun:stun.l.google.com:19302' }];
        this.audio = config.audio !== false;
        this.video = config.video === true;

        this.signaling = new Signaling(this.socketUrl, this.apiKey);
        this.webrtc = null;
        this.sessionId = null;
        this.isInitiator = false;
    }

    async connect() {
        await this.signaling.connect();
        this.listen();
    }

    listen() {
        this.signaling.on('participant-joined', (payload) => {
            this.emit('participant-joined', payload);

            const isMe = payload.socketId === this.signaling.socket.id;
            if (isMe) {
                this.isInitiator = payload.participants === 1;
            } else if (payload.participants === 2 && this.isInitiator) {
                this.startWebRTCOffer();
            }
        });

        this.signaling.on('participant-left', (payload) => {
            this.emit('participant-left', payload);
        });

        this.signaling.on('call-started', () => {
            this.emit('call-started');
        });

        this.signaling.on('call-paused', (payload) => {
            this.emit('call-paused', payload);
        });

        this.signaling.on('call-resumed', () => {
            this.emit('call-resumed');
        });

        this.signaling.on('call-ended', (payload) => {
            this.emit('call-ended', payload);
            this.cleanupWebRTC();
        });

        this.signaling.on('offer', async (data) => {
            this.emit('offer', data);
            await this.handleOffer(data);
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
                    console.warn('Error adding ICE candidate', e);
                }
            }
        });
    }

    async joinSession(sessionId) {
        if (!this.signaling.socket) {
            await this.connect();
        }
        this.sessionId = sessionId;
        this.signaling.send('join-session', {
            sessionId,
            userId: this.userId,
        });
        this.emit('joined-session', { sessionId });
    }

    async startWebRTCOffer() {
        try {
            this.cleanupWebRTC();
            this.webrtc = new WebRTC(this.iceServers);
            this.setupWebRTCEvents();

            const localStream = await this.webrtc.initialize(this.audio, this.video);
            this.emit('local-stream', localStream);

            const offer = await this.webrtc.createOffer();
            this.signaling.send('offer', {
                sessionId: this.sessionId,
                offer,
                senderId: this.userId,
            });
        } catch (err) {
            this.emit('error', err);
        }
    }

    async handleOffer(data) {
        try {
            this.isInitiator = false;
            this.cleanupWebRTC();
            this.webrtc = new WebRTC(this.iceServers);
            this.setupWebRTCEvents();

            const localStream = await this.webrtc.initialize(this.audio, this.video);
            this.emit('local-stream', localStream);

            await this.webrtc.setRemoteDescription(new RTCSessionDescription(data.offer));
            const answer = await this.webrtc.createAnswer();
            this.signaling.send('answer', {
                sessionId: this.sessionId,
                answer,
                senderId: this.userId,
            });
        } catch (err) {
            this.emit('error', err);
        }
    }

    setupWebRTCEvents() {
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
    }

    async leaveSession() {
        if (this.sessionId) {
            this.signaling.send('leave-session', {
                sessionId: this.sessionId,
            });
            this.cleanupWebRTC();
            this.sessionId = null;
        }
    }

    async endCall() {
        if (this.sessionId) {
            this.signaling.send('end-call', {
                sessionId: this.sessionId,
            });
            this.cleanupWebRTC();
            this.sessionId = null;
        }
    }

    cleanupWebRTC() {
        if (this.webrtc) {
            if (this.webrtc.pc) {
                this.webrtc.pc.close();
            }
            if (this.webrtc.localStream) {
                this.webrtc.localStream.getTracks().forEach((track) => track.stop());
            }
            this.webrtc = null;
        }
    }
}
