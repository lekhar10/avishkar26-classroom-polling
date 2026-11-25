const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');
const { generateRoomCode } = require('../utils/helpers');

// Create Room
router.post('/create', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Room title is required' });

    const code = await generateRoomCode();
    const hostToken = `host_${uuidv4()}`;

    const result = await pool.query(
      'INSERT INTO rooms (code, title, host_token) VALUES ($1, $2, $3) RETURNING *',
      [code, title, hostToken]
    );

    res.status(201).json({
      success: true,
      room: result.rows[0],
      hostToken
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join Room Verification
router.get('/join/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await pool.query(
      'SELECT id, code, title, is_active FROM rooms WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Room code not found' });
    }

    res.json({ success: true, room: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
