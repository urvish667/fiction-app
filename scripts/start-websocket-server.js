/**
 * WebSocket Server Startup Script
 *
 * This script starts a WebSocket server for real-time notifications.
 * It connects to Redis for pub/sub and handles client connections.
 */

require('dotenv').config();
const path = require('path');

// Register TypeScript compiler
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: {
    module: 'commonjs',
    moduleResolution: 'node',
  },
});

// Set up module aliases for @ imports
const tsConfig = require('../tsconfig.json');
const tsConfigPaths = require('tsconfig-paths');

const baseUrl = './'; // This is relative to the project root
const cleanup = tsConfigPaths.register({
  baseUrl,
  paths: tsConfig.compilerOptions.paths || {},
});

// Import WebSocket server
const { initWebSocketServer } = require('../src/lib/websocket');

// Get port from environment or use default
const port = process.env.WS_PORT || 3001;

// Start WebSocket server
console.log(`Starting WebSocket server on port ${port}...`);
initWebSocketServer(port);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down WebSocket server...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down WebSocket server...');
  process.exit(0);
});

console.log('WebSocket server running. Press Ctrl+C to stop.');
