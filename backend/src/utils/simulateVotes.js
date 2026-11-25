const { io } = require('socket.io-client');

const socket = io('http://localhost:5000');
const roomCode = '756772';
const pollId = 'poll-01';
const optionIds = ['opt-1', 'opt-2', 'opt-3', 'opt-4'];

console.log('⚡ Automated Live Vote Simulator Started!');
console.log(`📌 Streaming live votes to Room [${roomCode}] every 800ms...`);

let count = 0;
const interval = setInterval(async () => {
  count++;
  const randomOpt = optionIds[Math.floor(Math.random() * optionIds.length)];
  const sessionToken = `sim_live_${count}_${Math.random().toString(36).substring(2, 6)}`;

  try {
    // 1. Send vote payload to backend REST API
    await fetch('http://localhost:5000/api/polls/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pollId, optionId: randomOpt, sessionToken })
    });

    // 2. Broadcast WebSocket event to update Presenter Screen in real-time
    socket.emit('vote:submit', { roomCode, pollId, optionId: randomOpt });
    console.log(`🗳️  [Vote #${count}] Cast live vote for option: ${randomOpt}`);
  } catch (err) {
    console.error('Vote Simulation Error:', err.message);
  }

  if (count >= 25) {
    clearInterval(interval);
    console.log('✅ Automated Vote Simulation Completed! (25 Live Votes Streamed)');
    socket.disconnect();
    process.exit(0);
  }
}, 800);
