const Redis = require('ioredis');
require('dotenv').config();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    if (times > 3) return null;
    return Math.min(times * 200, 1000);
  }
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.warn('⚠️ Redis offline, using DB fallback:', err.message));

module.exports = redis;
