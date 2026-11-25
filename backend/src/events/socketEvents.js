// Socket.io Real-Time Event Handlers
module.exports = function registerSocketEvents(io, socket) {
  socket.on('room:join', ({ roomCode }) => {
    if (roomCode) socket.join(String(roomCode));
  });
};
