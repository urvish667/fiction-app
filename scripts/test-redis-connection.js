/**
 * Redis Connection Test Script
 * Run this to diagnose Redis connection issues
 * 
 * Usage: node test-redis-connection.js
 */

require('dotenv').config({ path: '.env' });
const { Redis } = require('ioredis');

console.log('\n=== Redis Connection Test ===\n');

// Display configuration
console.log('Configuration:');
console.log('  REDIS_ENABLED:', process.env.REDIS_ENABLED || 'NOT SET (defaults to enabled)');
console.log('  REDIS_HOST:', process.env.REDIS_HOST || 'NOT SET');
console.log('  REDIS_PORT:', process.env.REDIS_PORT || 'NOT SET');
console.log('  REDIS_PASSWORD:', process.env.REDIS_PASSWORD ? '***SET***' : 'NOT SET');
console.log('  REDIS_TLS:', process.env.REDIS_TLS || 'NOT SET');
console.log('  VIEW_TRACKING_REDIS_ENABLED:', process.env.VIEW_TRACKING_REDIS_ENABLED || 'NOT SET');
console.log('  REDIS_URL:', process.env.REDIS_URL ? '***SET***' : 'NOT SET');
console.log('');

// Check if Redis is disabled
if (process.env.REDIS_ENABLED === 'false') {
  console.error('❌ REDIS_ENABLED is set to false. Redis is disabled.');
  process.exit(1);
}

// Check required variables
const host = process.env.REDIS_HOST;
const port = process.env.REDIS_PORT;
const password = process.env.REDIS_PASSWORD;
const tls = process.env.REDIS_TLS === 'true';

if (!host || !port || !password) {
  console.error('❌ Missing required Redis configuration:');
  if (!host) console.error('   - REDIS_HOST is not set');
  if (!port) console.error('   - REDIS_PORT is not set');
  if (!password) console.error('   - REDIS_PASSWORD is not set');
  process.exit(1);
}

// Construct Redis URL
const protocol = tls ? 'rediss' : 'redis';
const redisUrl = `${protocol}://:${password}@${host}:${port}`;

console.log('Attempting to connect to Redis...');
console.log(`  URL: ${protocol}://:***@${host}:${port}`);
console.log('');

// Create Redis client
const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => {
    console.log(`  Retry attempt ${times}...`);
    return Math.min(times * 100, 1000);
  },
  enableReadyCheck: true,
  connectTimeout: 10000,
  lazyConnect: true, // Don't connect automatically
});

// Set up event handlers
redis.on('connect', () => {
  console.log('✅ Redis client connected!');
});

redis.on('ready', () => {
  console.log('✅ Redis client ready!');
});

redis.on('error', (error) => {
  console.error('❌ Redis client error:', error.message);
});

redis.on('close', () => {
  console.log('⚠️  Redis client connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis client reconnecting...');
});

redis.on('end', () => {
  console.log('⚠️  Redis client connection ended');
});

// Test connection
async function testConnection() {
  try {
    console.log('Connecting...');
    await redis.connect();
    
    console.log('\nTesting PING command...');
    const pong = await redis.ping();
    console.log('✅ PING response:', pong);
    
    console.log('\nTesting SET command...');
    await redis.set('test:connection', 'success');
    console.log('✅ SET command successful');
    
    console.log('\nTesting GET command...');
    const value = await redis.get('test:connection');
    console.log('✅ GET command successful, value:', value);
    
    console.log('\nCleaning up test key...');
    await redis.del('test:connection');
    console.log('✅ Cleanup successful');
    
    console.log('\nChecking for existing view buffers...');
    const storyKeys = await redis.keys('views:story:buffer:*');
    const chapterKeys = await redis.keys('views:chapter:buffer:*');
    console.log(`  Story view buffers: ${storyKeys.length}`);
    console.log(`  Chapter view buffers: ${chapterKeys.length}`);
    
    if (storyKeys.length > 0) {
      console.log('\n  Sample story buffers:');
      for (let i = 0; i < Math.min(5, storyKeys.length); i++) {
        const count = await redis.get(storyKeys[i]);
        console.log(`    ${storyKeys[i]}: ${count} views`);
      }
    }
    
    if (chapterKeys.length > 0) {
      console.log('\n  Sample chapter buffers:');
      for (let i = 0; i < Math.min(5, chapterKeys.length); i++) {
        const count = await redis.get(chapterKeys[i]);
        console.log(`    ${chapterKeys[i]}: ${count} views`);
      }
    }
    
    console.log('\n✅ All tests passed! Redis is working correctly.');
    console.log('\n=== Connection Test Complete ===\n');
    
    // Check view tracking configuration
    if (process.env.VIEW_TRACKING_REDIS_ENABLED !== 'true') {
      console.log('⚠️  WARNING: VIEW_TRACKING_REDIS_ENABLED is not set to "true"');
      console.log('   View tracking will NOT use Redis unless you set:');
      console.log('   VIEW_TRACKING_REDIS_ENABLED=true');
      console.log('');
    }
    
  } catch (error) {
    console.error('\n❌ Connection test failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Check if Redis is running on', host + ':' + port);
    console.error('  2. Verify the password is correct');
    console.error('  3. Check firewall rules allow connection from this machine');
    console.error('  4. Try: redis-cli -h', host, '-p', port, '-a', password, 'ping');
    console.error('');
  } finally {
    await redis.quit();
    process.exit(0);
  }
}

// Run the test
testConnection();
