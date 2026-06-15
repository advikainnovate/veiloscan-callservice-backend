const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { CONFIG } = require('./src/config');
const signalingSocket = require('./src/modules/calls/signaling.socket');
const chatSocket = require('./src/modules/chats/chat.socket');

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

signalingSocket(io);
chatSocket(io);

server.listen(CONFIG.APP.PORT, () => console.log(`Server running on ${CONFIG.APP.PORT}`));
