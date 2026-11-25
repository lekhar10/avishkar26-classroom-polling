require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');

const pool = require('./config/db');
const redis = require('./config/redis');
const SOCKET_EVENTS = require('./events/socketEvents');

const roomRoutes = require('./routes/roomRoutes');
const pollRoutes = require('./routes/pollRoutes');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

// REST Routes
app.use('/api/rooms', roomRoutes);
app.use('/api/polls', pollRoutes);

// Health Check Endpoint
app.get('/health', async (req, res) => {
  try {
    const dbRes = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      postgres: dbRes.rows[0].now,
      redis: redis.status
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// Socket.io Real-Time Engine
const io = new Server(server, {
  cors: { origin: process.env.CLIENT_ORIGIN || '*', methods: ['GET', 'POST'] }
});

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  socket.on(SOCKET_EVENTS.CLIENT.JOIN_ROOM, ({ roomCode, role }) => {
    socket.join(roomCode);
    console.log(`👤 Socket ${socket.id} joined room [${roomCode}] as ${role}`);
    socket.emit(SOCKET_EVENTS.SERVER.ROOM_JOINED, { roomCode, role });
  });

  socket.on(SOCKET_EVENTS.CLIENT.SUBMIT_VOTE, async (data) => {
    const { roomCode, pollId } = data;
    io.to(roomCode).emit(SOCKET_EVENTS.SERVER.VOTE_UPDATE, { pollId, timestamp: new Date() });
  });

  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 CODEWARRIORS Backend running on http://localhost:${PORT}`);
});
