require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: '*' }));
app.use(express.json());

const store = {
  teamInfo: {
    id: 'AV26-756772BCAB',
    name: 'Code warriors',
    members: ['KC Spoorti', 'Deeksha B', 'Lekha R', 'Sanjana HR']
  },
  rooms: {
    '756772': {
      id: 'room-756772',
      code: '756772',
      title: 'AVISHKAR 2026 Keynote Presentation',
      hostToken: 'host_demo_key'
    }
  },
  polls: {
    'poll-01': {
      id: 'poll-01',
      roomId: '756772',
      question: "Rate today's live presentation & WebSocket responsiveness:",
      type: 'rating',
      status: 'active'
    }
  },
  options: [
    { id: 'opt-1', pollId: 'poll-01', option_text: 'Socket.io Engine', votes: 22 },
    { id: 'opt-2', pollId: 'poll-01', option_text: 'Redis Lock Buffer', votes: 18 },
    { id: 'opt-3', pollId: 'poll-01', option_text: 'PostgreSQL DB', votes: 8 },
    { id: 'opt-4', pollId: 'poll-01', option_text: 'React UI', votes: 4 }
  ],
  votes: [],
  questions: [
    { id: 'q-1', roomId: '756772', author_name: 'KC Spoorti', content: 'How does session token double-vote locking work across browser refreshes?', upvotes: 24, status: 'pinned' },
    { id: 'q-2', roomId: '756772', author_name: 'Deeksha B', content: 'Does Redis handle pub/sub connection if the Node server restarts?', upvotes: 19, status: 'pending' },
    { id: 'q-3', roomId: '756772', author_name: 'Lekha R', content: 'Can professors export post-session Q&A as a PDF summary?', upvotes: 14, status: 'answered' },
    { id: 'q-4', roomId: '756772', author_name: 'Sanjana HR', content: 'What is the maximum audience limit for concurrent socket connections?', upvotes: 8, status: 'pending' }
  ],
  votedTokens: new Set()
};

const io = new Server(server, { cors: { origin: '*' } });

app.post('/api/rooms/create', (req, res) => {
  const { title } = req.body || {};
  const roomTitle = (title && title.trim()) || 'AVISHKAR 2K26 Live Session';
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const room = { id: `room-${code}`, code, title: roomTitle, hostToken: `host_${Date.now()}` };
  store.rooms[code] = room;
  res.status(201).json({ success: true, room, hostToken: room.hostToken });
});

app.get('/api/rooms/join/:code', (req, res) => {
  const code = String(req.params.code || '').trim();
  let room = store.rooms[code];
  if (!room) {
    room = {
      id: `room-${code}`,
      code,
      title: 'AVISHKAR 2K26 Keynote Presentation',
      hostToken: `host_${Date.now()}`
    };
    store.rooms[code] = room;
  }
  res.json({ success: true, room });
});

app.get('/api/polls/active/:roomId', (req, res) => {
  const roomId = String(req.params.roomId || '').trim();
  const activePoll = Object.values(store.polls)
    .reverse()
    .find((p) => p.roomId === roomId && p.status === 'active');

  if (!activePoll) {
    return res.json({ success: true, poll: null, options: [] });
  }
  const options = store.options.filter((o) => o.pollId === activePoll.id);
  res.json({ success: true, poll: activePoll, options });
});

app.post('/api/polls/create', (req, res) => {
  const { roomId, question, type, options } = req.body || {};
  const cleanRoomId = String(roomId || '756772').trim();
  const poll = {
    id: `poll-${Date.now()}`,
    roomId: cleanRoomId,
    question: String(question || '').trim(),
    type: type || 'mcq',
    status: 'active'
  };
  store.polls[poll.id] = poll;

  let createdOpts = [];
  if (poll.type === 'mcq' && Array.isArray(options)) {
    createdOpts = options.map((optText, idx) => ({
      id: `opt-${Date.now()}-${idx}`,
      pollId: poll.id,
      option_text: String(optText).trim(),
      votes: 0
    }));
    store.options.push(...createdOpts);
  }

  io.to(cleanRoomId).emit('poll:created', { poll, options: createdOpts });
  res.status(201).json({ success: true, poll, options: createdOpts });
});

app.post('/api/polls/vote', (req, res) => {
  const { pollId, optionId, ratingVal, wordVal, sessionToken } = req.body || {};
  const lockKey = `${pollId}:${sessionToken}`;

  if (store.votedTokens.has(lockKey)) {
    return res.status(429).json({ error: 'You have already submitted a vote for this poll!' });
  }

  store.votedTokens.add(lockKey);

  if (optionId) {
    const option = store.options.find((o) => o.id === optionId);
    if (option) option.votes += 1;
  }

  store.votes.push({ pollId, optionId, ratingVal, wordVal, sessionToken });
  res.json({ success: true, message: 'Vote recorded successfully!' });
});

app.get('/api/questions/:roomId', (req, res) => {
  res.json({ success: true, questions: store.questions });
});

app.post('/api/questions/create', (req, res) => {
  const { authorName, content } = req.body || {};
  const question = {
    id: `q-${Date.now()}`,
    author_name: (authorName && String(authorName).trim()) || 'Anonymous',
    content: String(content || '').trim(),
    upvotes: 0,
    status: 'pending'
  };
  store.questions.unshift(question);
  res.status(201).json({ success: true, question });
});

app.post('/api/questions/upvote', (req, res) => {
  const { questionId } = req.body || {};
  const q = store.questions.find((item) => item.id === questionId);
  if (q) q.upvotes += 1;
  res.json({ success: true, question: q });
});

app.patch('/api/questions/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const q = store.questions.find((item) => item.id === id);
  if (q) q.status = status;
  res.json({ success: true, question: q });
});

io.on('connection', (socket) => {
  socket.on('room:join', ({ roomCode }) => {
    if (roomCode) socket.join(String(roomCode));
  });
  socket.on('vote:submit', (data) => {
    if (data && data.roomCode) io.to(String(data.roomCode)).emit('vote:live_stream', data);
  });
  socket.on('question:submit', (data) => {
    if (data && data.roomCode) io.to(String(data.roomCode)).emit('question:new_item', data.question);
  });
  socket.on('question:upvote', (data) => {
    if (data && data.roomCode) io.to(String(data.roomCode)).emit('question:item_changed', data);
  });
  socket.on('poll:end', (data) => {
    if (data && data.roomCode) io.to(String(data.roomCode)).emit('poll:ended_event', data);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 CODEWARRIORS Backend running on http://localhost:${PORT}`);
});
