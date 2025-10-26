// BossHouse_Backend/services/socket.js
const { Server } = require('socket.io');

let ioInstance = null;

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: { origin: '*', methods: ['GET','POST','PUT','DELETE'] }
  });

  ioInstance.on('connection', (socket) => {
    // Client có thể join room theo userId để nhận thông báo riêng
    socket.on('auth:join', (userId) => {
      if (userId) socket.join(String(userId));
    });
  });

  return ioInstance;
}

function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}

module.exports = { initSocket, getIO };