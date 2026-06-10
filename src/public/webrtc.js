const sessionIdInput = document.getElementById('sessionId');
const logArea = document.getElementById('log');
const remoteAudio = document.getElementById('remoteAudio');
const joinButton = document.getElementById('join');
const createOfferButton = document.getElementById('createOffer');
const hangupButton = document.getElementById('hangup');
const startMicButton = document.getElementById('startMic');
const stopMicButton = document.getElementById('stopMic');
const generateIdButton = document.getElementById('generateId');

const socket = io();
let pc = null;
let localStream = null;
let joined = false;

function log(message) {
  const time = new Date().toLocaleTimeString();
  logArea.value += `[${time}] ${message}\n`;
  logArea.scrollTop = logArea.scrollHeight;
}

function createPeerConnection() {
  if (pc) return pc;

  pc = new RTCPeerConnection();

  pc.onicecandidate = ({ candidate }) => {
    if (candidate) {
      const sessionId = sessionIdInput.value.trim();
      socket.emit('ice-candidate', { sessionId, candidate });
      log('Local ICE candidate sent');
    }
  };

  pc.ontrack = (event) => {
    log('Remote track received');
    remoteAudio.srcObject = event.streams[0];
  };

  pc.onconnectionstatechange = () => {
    log(`Peer connection state: ${pc.connectionState}`);
  };

  if (localStream) {
    localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    log('Local audio tracks attached to peer connection');
  }

  return pc;
}

async function startMic() {
  if (localStream) {
    log('Mic already started');
    return;
  }
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    log('Microphone access granted');
    if (pc) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
      log('Added mic tracks to existing peer connection');
    }
  } catch (err) {
    log(`Microphone error: ${err.message}`);
  }
}

function stopMic() {
  if (!localStream) {
    log('Mic is not active');
    return;
  }
  localStream.getTracks().forEach((track) => track.stop());
  localStream = null;
  log('Microphone stopped');
}

function joinSession() {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) {
    log('Enter a session ID first');
    return;
  }
  if (joined) {
    log('Already joined session');
    return;
  }

  socket.emit('join-session', { sessionId });
  joined = true;
  log(`Joining session ${sessionId}`);
}

async function createOffer() {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) {
    log('Enter a session ID first');
    return;
  }

  const connection = createPeerConnection();

  try {
    const offer = await connection.createOffer();
    await connection.setLocalDescription(offer);
    socket.emit('offer', { sessionId, ...offer });
    log('Offer sent');
  } catch (err) {
    log(`Offer error: ${err.message}`);
  }
}

async function createAnswer(offer) {
  const sessionId = sessionIdInput.value.trim();
  const connection = createPeerConnection();

  try {
    await connection.setRemoteDescription(offer);
    const answer = await connection.createAnswer();
    await connection.setLocalDescription(answer);
    socket.emit('answer', { sessionId, ...answer });
    log('Answer sent');
  } catch (err) {
    log(`Answer error: ${err.message}`);
  }
}

async function onOffer(data) {
  if (!data || !data.sessionId) return;
  log('Offer received');
  await createAnswer(data);
}

async function onAnswer(data) {
  if (!data || !data.sessionId) return;
  log('Answer received');
  if (!pc) {
    log('No peer connection available for answer');
    return;
  }
  try {
    await pc.setRemoteDescription(data);
    log('Remote description set from answer');
  } catch (err) {
    log(`Answer setRemoteDescription failed: ${err.message}`);
  }
}

async function onIceCandidate(data) {
  if (!data || !data.candidate) return;
  if (!pc) {
    log('No peer connection available for ICE candidate');
    return;
  }
  try {
    await pc.addIceCandidate(data.candidate);
    log('Remote ICE candidate added');
  } catch (err) {
    log(`ICE candidate error: ${err.message}`);
  }
}

function hangup() {
  if (pc) {
    pc.close();
    pc = null;
    log('Peer connection closed');
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
    log('Local media stopped');
  }
  remoteAudio.srcObject = null;
  joined = false;
}

socket.on('participant-joined', ({ participants, socketId }) => {
  log(`Participant joined: ${socketId}. participants=${participants}`);
});

socket.on('offer', async (data) => {
  await onOffer(data);
});

socket.on('answer', async (data) => {
  await onAnswer(data);
});

socket.on('ice-candidate', async (data) => {
  await onIceCandidate(data);
});

socket.on('call-started', () => {
  log('Call started event received');
});

socket.on('room-full', () => {
  log('Room is full; cannot join');
});

socket.on('error', (err) => {
  log(`Socket error: ${err.message || JSON.stringify(err)}`);
});

generateIdButton.addEventListener('click', () => {
  const id = crypto.randomUUID();
  sessionIdInput.value = id;
  log(`Generated session ID: ${id}`);
});

startMicButton.addEventListener('click', startMic);
stopMicButton.addEventListener('click', stopMic);
joinButton.addEventListener('click', joinSession);
createOfferButton.addEventListener('click', createOffer);
hangupButton.addEventListener('click', hangup);

log('Ready for WebRTC signaling.');
