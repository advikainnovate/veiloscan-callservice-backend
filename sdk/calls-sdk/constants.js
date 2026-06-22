export const CALL_STATUS = {
    IDLE: 'idle',
    RINGING: 'ringing',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    ENDED: 'ended',
    FAILED: 'failed',
};

export const EVENTS = {
    // Session lifecycle
    JOINED_SESSION: 'joined-session',
    PARTICIPANT_JOINED: 'participant-joined',
    PARTICIPANT_LEFT: 'participant-left',

    // Call lifecycle
    INCOMING_CALL: 'incoming-call',
    CALL_ACCEPTED: 'call-accepted',
    CALL_REJECTED: 'call-rejected',
    CALL_STARTED: 'call-started',
    CALL_PAUSED: 'call-paused',
    CALL_RESUMED: 'call-resumed',
    CALL_ENDED: 'call-ended',

    // Media
    LOCAL_STREAM: 'local-stream',
    REMOTE_STREAM: 'remote-stream',

    // Status
    STATUS_CHANGED: 'status-changed',

    // Controls
    MUTE_CHANGED: 'mute-changed',
    VIDEO_CHANGED: 'video-changed',

    // Connection quality
    CONNECTION_QUALITY: 'connection-quality',
    CONNECTION_LOST: 'connection-lost',

    // Errors
    ERROR: 'error',
    ROOM_FULL: 'room-full',
    CALL_TIMEOUT: 'call-timeout',
};

export const QUALITY = {
    GOOD: 'good',
    WEAK: 'weak',
    POOR: 'poor',
};
