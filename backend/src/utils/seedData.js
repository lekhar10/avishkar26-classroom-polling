const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function seedAdvancedDemoData() {
  try {
    console.log('🚀 Initializing database schema and generating synthetic audience data...');

    // 1. Automatically run init.sql to ensure all database tables exist
    const sqlPath = path.join(__dirname, '../../database/init.sql');
    if (fs.existsSync(sqlPath)) {
      const initSql = fs.readFileSync(sqlPath, 'utf8');
      await pool.query(initSql);
      console.log('✅ Database schema verified.');
    }

    // 2. Clear existing test room if present
    await pool.query("DELETE FROM rooms WHERE code = '756772'");

    // 3. Create Keynote Room
    const roomRes = await pool.query(
      "INSERT INTO rooms (code, title, host_token) VALUES ($1, $2, $3) RETURNING *",
      ['756772', 'AVISHKAR 2026 Keynote Presentation', 'host_demo_key_av26']
    );
    const room = roomRes.rows[0];

    // 4. Create Active MCQ Poll
    const pollRes = await pool.query(
      "INSERT INTO polls (room_id, question, type, status) VALUES ($1, $2, $3, $4) RETURNING *",
      [room.id, 'Which layer handles real-time audience scale best?', 'mcq', 'active']
    );
    const poll = pollRes.rows[0];

    const options = [
      'Socket.io Websocket Protocol',
      'Redis Pub/Sub Vote Lock Buffer',
      'PostgreSQL Indexed Relational Engine',
      'React Animated Recharts UI'
    ];

    const optionIds = [];
    for (let i = 0; i < options.length; i++) {
      const optRes = await pool.query(
        "INSERT INTO poll_options (poll_id, option_text, display_order) VALUES ($1, $2, $3) RETURNING id",
        [poll.id, options[i], i]
      );
      optionIds.push(optRes.rows[0].id);
    }

    // 5. Simulate 52 Concurrent Student Votes
    const voteDistribution = [22, 18, 8, 4];
    for (let optIdx = 0; optIdx < voteDistribution.length; optIdx++) {
      const voteCount = voteDistribution[optIdx];
      for (let v = 0; v < voteCount; v++) {
        const sessionToken = `sim_user_${optIdx}_${v}_${Math.random().toString(36).substring(2, 8)}`;
        await pool.query(
          "INSERT INTO votes (poll_id, option_id, session_token) VALUES ($1, $2, $3)",
          [poll.id, optionIds[optIdx], sessionToken]
        );
      }
    }

    // 6. Populate Live Q&A Feed with Upvotes
    const sampleQuestions = [
      { name: 'Pavan Kumar H K', text: 'How does the session token prevent students from submitting multiple votes on refresh?', upvotes: 24, status: 'pinned' },
      { name: 'Mahesh Kumar B', text: 'Does Redis maintain pub/sub connection if the main Node API crashes mid-lecture?', upvotes: 19, status: 'pending' },
      { name: 'Dhanush K S', text: 'Can professors export the live poll analytics as a PDF report at the end of class?', upvotes: 14, status: 'answered' },
      { name: 'Ananya S', text: 'Is there a rate-limit on how many Q&A questions a single IP can post per minute?', upvotes: 9, status: 'pending' },
      { name: 'Kiran R', text: 'What happens if 500 students scan the QR code simultaneously at the start of class?', upvotes: 6, status: 'pending' }
    ];

    for (const q of sampleQuestions) {
      await pool.query(
        "INSERT INTO questions (room_id, author_name, content, upvotes, status, session_token) VALUES ($1, $2, $3, $4, $5, $6)",
        [room.id, q.name, q.text, q.upvotes, q.status, 'seed_token_' + Math.random()]
      );
    }

    console.log('✅ Synthetic Demo Data Successfully Seeded!');
    console.log('📌 Room Code: 756772');
    console.log('📊 Total Simulated Votes: 52');
    console.log('💬 Total Q&A Questions: 5');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed Data Detailed Error:', err);
    process.exit(1);
  }
}

seedAdvancedDemoData();
