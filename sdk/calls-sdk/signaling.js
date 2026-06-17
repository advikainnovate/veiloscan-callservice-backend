/* global io */
export default class Signaling {
    constructor(socketUrl, apiKey) {
        this.socketUrl = socketUrl;
        this.apiKey = apiKey;
        this.socket = null;
    }

    connect() {
        return new Promise((resolve, reject) => {
            const socketio = typeof io !== 'undefined' ? io : typeof window !== 'undefined' && window.io;

            if (!socketio) {
                return reject(
                    new Error(
                        'Socket.io client library (io) is not loaded. Please include <script src="/socket.io/socket.io.js"></script> or equivalent CDN script in your HTML.'
                    )
                );
            }

            this.socket = socketio(this.socketUrl, {
                auth: {
                    apiKey: this.apiKey,
                },
                autoConnect: false,
            });

            this.socket.connect();

            this.socket.on('connect', () => resolve());
            this.socket.on('connect_error', (err) => reject(err));
        });
    }

    send(event, payload) {
        if (this.socket) {
            this.socket.emit(event, payload);
        }
    }

    on(event, callback) {
        if (this.socket) {
            this.socket.on(event, callback);
        }
    }
}
