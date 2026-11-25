const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const redis = require('../config/redis');

// Create Poll
router.post('/create', async (req, res) => {
  const client = await pool.connect();
  try {
    const { roomId, question, type, options } = req.body;
    
    await client.query('BEGIN');
    const pollRes = await client.query(
      'INSERT INTO polls (room_id, question, type, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [roomId, question, type, 'draft']
    );
    const poll = pollRes.rows[0];

    let createdOptions = [];
    if (type === 'mcq' && Array.isArray(options)) {
      for (let i = 0; i < options.length; i++) {
        const optRes = await client.query(
          'INSERT INTO poll_options (poll_id, option_text, display_order) VALUES ($1, $2, $3) RETURNING *',
          [poll.id, options[i], i]
        );
        createdOptions.push(optRes.rows[0]);
      }
    }
    await client.query('COMMIT');

    res.status(201).json({ success: true, poll, options: createdOptions });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Submit Vote with Locking
router.post('/vote', async (req, res) => {
  try {
    const { pollId, optionId, ratingVal, wordVal, sessionToken } = req.body;
    if (!pollId || !sessionToken) {
      return res.status(400).json({ error: 'pollId and sessionToken are required' });
    }

    const redisKey = `vote_lock:${pollId}:${sessionToken}`;
    if (redis.status === 'ready') {
      const alreadyVoted = await redis.get(redisKey);
      if (alreadyVoted) {
        return res.status(429).json({ error: 'You have already voted in this poll.' });
      }
    }

    try {
      await pool.query(
        'INSERT INTO votes (poll_id, option_id, rating_val, word_val, session_token) VALUES ($1, $2, $3, $4, $5)',
        [pollId, optionId || null, ratingVal || null, wordVal || null, sessionToken]
      );
    } catch (dbErr) {
      if (dbErr.code === '23505') {
        return res.status(429).json({ error: 'You have already voted in this poll.' });
      }
      throw dbErr;
    }

    if (redis.status === 'ready') {
      await redis.set(redisKey, '1', 'EX', 86400);
    }

    res.json({ success: true, message: 'Vote recorded successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
