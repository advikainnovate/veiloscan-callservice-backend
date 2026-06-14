import EventEmitter from "./EventEmitter.js";
import Signaling from "./signaling.js";
import WebRTC from "./webrtc.js";
import { EVENTS } from "./constants.js";

export default class CallManager extends EventEmitter {
  constructor(config) {
    super();

    this.userId = config.userId;

    this.signaling = new Signaling(config.socketUrl);

    this.webrtc = new WebRTC(config.iceServers);
  }

  async connect() {
    await this.signaling.connect();

    this.signaling.send("register", {
      userId: this.userId,
    });

    this.listen();
  }

  listen() {
    this.signaling.on(async (message) => {
      const { event, payload } = message;

      switch (event) {
        case "incoming:call":
          this.emit(EVENTS.INCOMING_CALL, payload);
          break;

        case "webrtc:offer":
          await this.handleOffer(payload);
          break;

        case "webrtc:answer":
          await this.webrtc.setRemoteDescription(
            payload.answer
          );
          break;

        case "webrtc:ice":
          await this.webrtc.addIceCandidate(
            payload.candidate
          );
          break;
      }
    });
  }

  async startCall(receiverId) {
    await this.webrtc.initialize();

    const offer = await this.webrtc.createOffer();

    this.signaling.send("call:initiate", {
      receiverId,
      offer,
    });
  }

  async handleOffer(payload) {
    await this.webrtc.initialize();

    await this.webrtc.setRemoteDescription(
      payload.offer
    );

    const answer =
      await this.webrtc.createAnswer();

    this.signaling.send("webrtc:answer", {
      callerId: payload.callerId,
      answer,
    });
  }
}