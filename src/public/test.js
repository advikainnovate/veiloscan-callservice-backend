const output = document.getElementById('log');
const baseUrlInput = document.getElementById('baseUrl');
const sessionIdInput = document.getElementById('sessionId');
let localStream = null;

function log(message) {
  const time = new Date().toLocaleTimeString();
  output.value += `[${time}] ${message}\n`;
  output.scrollTop = output.scrollHeight;
}

function getBaseUrl() {
  return baseUrlInput.value.trim().replace(/\/$/, '');
}

async function request(path, options = {}) {
  const url = `${getBaseUrl()}${path}`;
  log(`FETCH ${options.method || 'GET'} ${url}`);
  try {
    const resp = await fetch(url, options);
    const text = await resp.text();
    let body;
    try { body = JSON.parse(text); } catch (err) { body = text; }
    log(`RESPONSE ${resp.status} ${resp.statusText}`);
    log(JSON.stringify(body, null, 2));
    return { resp, body };
  } catch (err) {
    log(`ERROR ${err.message}`);
    throw err;
  }
}

async function initiateCall() {
  const payload = { clientId: 'test-client' };
  const { body } = await request('/calls/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (body && body.data && body.data.sessionId) {
    sessionIdInput.value = body.data.sessionId;
  }
}

async function getSession() {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) return log('Provide sessionId first');
  await request(`/calls/session/${encodeURIComponent(sessionId)}`);
}

async function acceptCall() {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) return log('Provide sessionId first');
  await request(`/calls/session/${encodeURIComponent(sessionId)}/accept`, {
    method: 'PATCH'
  });
}

async function rejectCall() {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) return log('Provide sessionId first');
  await request(`/calls/session/${encodeURIComponent(sessionId)}/reject`, {
    method: 'PATCH'
  });
}

async function endCall() {
  const sessionId = sessionIdInput.value.trim();
  if (!sessionId) return log('Provide sessionId first');
  await request(`/calls/session/${encodeURIComponent(sessionId)}/end`, {
    method: 'POST'
  });
}

async function startMic() {
  if (localStream) {
    log('Mic already started');
    return;
  }
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.muted = true;
    audio.srcObject = localStream;
    document.body.appendChild(audio);
    log('Local microphone started. Audio is muted in the page to avoid feedback.');
  } catch (err) {
    log(`Mic start failed: ${err.message}`);
  }
}

function stopMic() {
  if (!localStream) {
    log('Mic is not running');
    return;
  }
  localStream.getTracks().forEach((track) => track.stop());
  localStream = null;
  log('Local microphone stopped.');
}

function bindHandlers() {
  document.getElementById('initiate').addEventListener('click', initiateCall);
  document.getElementById('getSession').addEventListener('click', getSession);
  document.getElementById('accept').addEventListener('click', acceptCall);
  document.getElementById('reject').addEventListener('click', rejectCall);
  document.getElementById('end').addEventListener('click', endCall);
  document.getElementById('startMic').addEventListener('click', startMic);
  document.getElementById('stopMic').addEventListener('click', stopMic);
}

window.addEventListener('DOMContentLoaded', () => {
  bindHandlers();
  log('Ready. Use the buttons to test call session endpoints.');
});
