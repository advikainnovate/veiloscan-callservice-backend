const joinBtn = document.getElementById('joinBtn');
const startCallBtn = document.getElementById('startCallBtn');
const endCallBtn = document.getElementById('endCallBtn');
const localAudio = document.getElementById('localAudio');
const remoteAudio = document.getElementById('remoteAudio');
const userIdField = document.getElementById('userId');
const sessionIdField = document.getElementById('sessionId');
const statusEl = document.getElementById('status');

let socket;
let peerConnection;
let localStream = null;
let joined = false;

const iceConfig = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const log = (message) => {
  console.log(`[Call Demo] ${message}`);
  if (statusEl) {
    statusEl.textContent = `Status: ${message}`;
  }
};

async function initLocalStream() {
  if (!localStream) {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    localAudio.srcObject = localStream;
  }
}

function setStatus(status) {
  if (statusEl) {
    statusEl.textContent = `Status: ${status}`;
  }
}

function initSocket() {
  if (socket) return;
  socket = io();

  socket.on('connect', () => {
    log(`Socket connected ${socket.id}`);
    setStatus('connected');
  });

  socket.on('participant-joined', (payload) => {
    log(`Participant joined: ${JSON.stringify(payload)}`);
    setStatus(`joined, participants: ${payload.participants}`);

    if (payload.participants === 2) {
      log('Peer connected — ready to start call');
      setStatus('peer connected');
    }
  });

  socket.on('call-started', () => {
    log('Call started');
    setStatus('call started');
  });

  socket.on('offer', async (data) => {
    log('Received offer');
    await initLocalStream();
    startPeerConnection();
    localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
    await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);
    socket.emit('answer', {
      sessionId: data.sessionId,
      answer,
      senderId: userIdField.value || 'guest'
    });
  });

  socket.on('answer', async (data) => {
    log('Received answer');
    if (peerConnection) {
      await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  });

  socket.on('ice-candidate', async (data) => {
    log('Received ICE candidate');
    if (peerConnection && data.candidate) {
      try {
        await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.warn('ICE candidate failed', error);
      }
    }
  });

  socket.on('disconnect', () => {
    log('Socket disconnected');
    setStatus('disconnected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connect_error', err);
    log('Connect error');
    setStatus('connect_error');
  });

  socket.on('connect_timeout', () => {
    log('Connect timeout');
    setStatus('connect_timeout');
  });

  socket.on('error', (err) => {
    console.error('Socket error', err);
    log('Socket error');
    setStatus('socket_error');
  });
}

function startPeerConnection() {
  if (peerConnection) return;
  peerConnection = new RTCPeerConnection(iceConfig);

  peerConnection.onicecandidate = ({ candidate }) => {
    if (candidate && socket && sessionIdField.value.trim()) {
      socket.emit('ice-candidate', {
        sessionId: sessionIdField.value.trim(),
        candidate,
        senderId: userIdField.value || 'guest'
      });
    }
  };

  peerConnection.ontrack = ({ streams }) => {
    remoteAudio.srcObject = streams[0];
  };
}

async function joinSession() {
  const sessionId = sessionIdField.value.trim();
  if (!sessionId) {
    alert('Enter a session ID first');
    return;
  }
  initSocket();
  socket.emit('join-session', { sessionId });
  joined = true;
  log(`Joined session ${sessionId}`);
}

async function startCall() {
  if (!joined) {
    alert('Join a session first');
    return;
  }
  await initLocalStream();
  startPeerConnection();
  localStream.getTracks().forEach((track) => peerConnection.addTrack(track, localStream));
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', {
    sessionId: sessionIdField.value.trim(),
    offer,
    senderId: userIdField.value || 'guest'
  });
  log('Sent offer');
}

function endCall() {
  if (peerConnection) {
    peerConnection.close();
    peerConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }
  localAudio.srcObject = null;
  remoteAudio.srcObject = null;
  log('Call ended');
  setStatus('ended');
}

joinBtn.addEventListener('click', joinSession);
startCallBtn.addEventListener('click', startCall);
endCallBtn.addEventListener('click', endCall);
