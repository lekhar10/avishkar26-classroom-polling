const pool = require('../config/db');

async function generateRoomCode() {
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    code = Math.floor(100000 + Math.random() * 900000).toString();
    const existing = await pool.query('SELECT id FROM rooms WHERE code = $1', [code]);
    if (existing.rows.length === 0) {
      isUnique = true;
    }
  }
  return code;
}

module.exports = { generateRoomCode };
