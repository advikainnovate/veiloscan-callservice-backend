export default class WebRTC {
  constructor(iceServers = []) {
    this.pc = new RTCPeerConnection({
      iceServers,
    });

    this.localStream = null;
  }

  async initialize(audio = true, video = false) {
    this.localStream =
      await navigator.mediaDevices.getUserMedia({
        audio,
        video,
      });

    this.localStream
      .getTracks()
      .forEach((track) => {
        this.pc.addTrack(track, this.localStream);
      });

    return this.localStream;
  }

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

  onIceCandidate(callback) {
    this.pc.onicecandidate = (event) => {
      if (event.candidate) {
        callback(event.candidate);
      }
    };
  }

  onRemoteStream(callback) {
    this.pc.ontrack = (event) => {
      callback(event.streams[0]);
    };
  }
}