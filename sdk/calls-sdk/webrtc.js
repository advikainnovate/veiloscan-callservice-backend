export default class WebRTC {
    constructor(iceServers = []) {
        this.pc = new RTCPeerConnection({ iceServers });
        this.localStream = null;
        this._qualityInterval = null;
        this._onQuality = null;
        this._onConnectionLost = null;
    }

    // ─── Media ───────────────────────────────────────────────────────────────

    async initialize(audio = true, video = false) {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio, video });
        this.localStream.getTracks().forEach((track) => this.pc.addTrack(track, this.localStream));
        return this.localStream;
    }

    // ─── Mute / Unmute ───────────────────────────────────────────────────────

    setAudioEnabled(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach((track) => {
                track.enabled = enabled;
            });
        }
    }

    isAudioEnabled() {
        if (!this.localStream) return false;
        const tracks = this.localStream.getAudioTracks();
        return tracks.length > 0 && tracks[0].enabled;
    }

    // ─── Camera On / Off ─────────────────────────────────────────────────────

    setVideoEnabled(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach((track) => {
                track.enabled = enabled;
            });
        }
    }

    isVideoEnabled() {
        if (!this.localStream) return false;
        const tracks = this.localStream.getVideoTracks();
        return tracks.length > 0 && tracks[0].enabled;
    }

    // ─── Offer / Answer ──────────────────────────────────────────────────────

    async createOffer() {
        const offer = await this.pc.createOffer();
        await this.pc.setLocalDescription(offer);
        return offer;
    }

    async createAnswer() {
        const answer = await this.pc.createAnswer();
        await this.pc.setLocalDescription(answer);
        return answer;
    }

    async setRemoteDescription(description) {
        await this.pc.setRemoteDescription(description);
    }

    async addIceCandidate(candidate) {
        await this.pc.addIceCandidate(candidate);
    }

    // ─── Events ──────────────────────────────────────────────────────────────

    onIceCandidate(callback) {
        this.pc.onicecandidate = (event) => {
            if (event.candidate) callback(event.candidate);
        };
    }

    onRemoteStream(callback) {
        this.pc.ontrack = (event) => {
            if (event.streams && event.streams[0]) callback(event.streams[0]);
        };
    }

    /**
     * ICE connection state changes — fires connection-lost when failed/disconnected
     */
    onIceStateChange(onLost) {
        this._onConnectionLost = onLost;
        this.pc.oniceconnectionstatechange = () => {
            const state = this.pc.iceConnectionState;
            if (state === 'failed' || state === 'disconnected' || state === 'closed') {
                if (this._onConnectionLost) this._onConnectionLost(state);
            }
        };
    }

    /**
     * Poll connection stats every 4s to emit quality events
     */
    startQualityMonitor(callback) {
        this._onQuality = callback;
        this._qualityInterval = setInterval(async () => {
            if (!this.pc) return;
            try {
                const stats = await this.pc.getStats();
                let rtt = null;
                let packetsLost = 0;
                let packetsSent = 0;

                stats.forEach((report) => {
                    if (report.type === 'remote-inbound-rtp' && report.roundTripTime != null) {
                        rtt = report.roundTripTime;
                    }
                    if (report.type === 'outbound-rtp') {
                        packetsLost += report.packetsLost || 0;
                        packetsSent += report.packetsSent || 0;
                    }
                });

                const lossRate = packetsSent > 0 ? packetsLost / packetsSent : 0;
                let quality = 'good';
                if (rtt > 0.3 || lossRate > 0.05) quality = 'weak';
                if (rtt > 0.6 || lossRate > 0.15) quality = 'poor';

                if (this._onQuality) this._onQuality({ quality, rtt, lossRate });
            } catch (_) {
                // stats unavailable — ignore
            }
        }, 4000);
    }

    stopQualityMonitor() {
        if (this._qualityInterval) {
            clearInterval(this._qualityInterval);
            this._qualityInterval = null;
        }
    }

    // ─── Cleanup ─────────────────────────────────────────────────────────────

    destroy() {
        this.stopQualityMonitor();
        if (this.localStream) {
            this.localStream.getTracks().forEach((t) => t.stop());
            this.localStream = null;
        }
        if (this.pc) {
            this.pc.close();
            this.pc = null;
        }
    }
}
