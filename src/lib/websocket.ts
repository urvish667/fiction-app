/**
 * WebSocket server implementation for FableSpace
 *
 * This module provides a WebSocket server for real-time notifications.
 * It handles client connections, authentication, and message routing.
 *
 * Note: This is designed to run as a separate service alongside the Next.js app.
 * In a production environment, you would deploy this as a separate service or
 * use a managed WebSocket service like Pusher, Socket.io, or similar.
 */

import { Redis } from 'ioredis';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage } from 'http';
import { parse } from 'url';
import { logger } from '@/lib/logger';
import { redis, REDIS_CHANNELS } from './redis';
import { verifyWebSocketToken } from './auth/ws-auth';

// WebSocket server instance
let wss: WebSocketServer | null = null;

// Connected clients map (userId -> WebSocket[])
const clients = new Map<string, WebSocket[]>();

// Redis subscriber client
let subscriber: Redis | null = null;

/**
 * Initialize the WebSocket server
 * @param port The port to listen on (default: 3001)
 */
export function initWebSocketServer(port: number = 3001): void {
  // Create HTTP server
  const server = createServer((req, res) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
      res.end();
      return;
    }

    // Handle regular HTTP requests (not used for WebSockets)
    res.writeHead(404);
    res.end('Not found');
  });

  // Create WebSocket server
  wss = new WebSocketServer({ noServer: true });

  // Handle HTTP server upgrade
  server.on('upgrade', async (request: IncomingMessage, socket, head) => {
    try {
      // Parse URL and query parameters
      const { pathname, query } = parse(request.url || '', true);

      // Only handle WebSocket connections to /api/ws
      if (pathname !== '/api/ws') {
        socket.destroy();
        return;
      }

      // Add CORS headers for WebSocket
      const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      };

      // Authenticate the connection
      logger.debug(`Authenticating WebSocket connection with token: ${query.token ? 'provided' : 'missing'}`);
      const tokenValue = Array.isArray(query.token) ? query.token[0] : query.token;
      const userId = await authenticateConnection(tokenValue || '');
      if (!userId) {
        logger.warn(`WebSocket authentication failed for token: ${tokenValue ? tokenValue.substring(0, 10) + '...' : 'missing'}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n');
        Object.entries(headers).forEach(([key, value]) => {
          socket.write(`${key}: ${value}\r\n`);
        });
        socket.write('\r\n');
        socket.destroy();
        return;
      }
      logger.debug(`WebSocket authentication successful for user: ${userId}`);

      // Upgrade the connection to WebSocket
      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit('connection', ws, request, userId);
      });
    } catch (error) {
      logger.error('WebSocket upgrade error:', error);
      socket.destroy();
    }
  });

  // Handle WebSocket connections
  wss.on('connection', (ws: WebSocket, _request: IncomingMessage, userId: string) => {
    logger.info(`WebSocket connection established for user ${userId}`);

    // Add client to clients map
    if (!clients.has(userId)) {
      clients.set(userId, []);
    }
    clients.get(userId)?.push(ws);

    // Set up ping/pong to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30000);

    // Handle client messages
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        handleClientMessage(userId, data, ws);
      } catch (error) {
        logger.error('Error handling WebSocket message:', error);
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      logger.info(`WebSocket connection closed for user ${userId}`);

      // Remove client from clients map
      const userClients = clients.get(userId) || [];
      const index = userClients.indexOf(ws);
      if (index !== -1) {
        userClients.splice(index, 1);
      }

      // Remove user from clients map if no more connections
      if (userClients.length === 0) {
        clients.delete(userId);
      }

      // Clear ping interval
      clearInterval(pingInterval);
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
    });

    // Send initial connection confirmation
    ws.send(JSON.stringify({
      type: 'connection',
      status: 'connected',
      userId,
    }));
  });

  // Start HTTP server
  server.listen(port, () => {
    logger.info(`WebSocket server listening on port ${port}`);

    // Initialize Redis subscriber
    initRedisSubscriber();
  });
}

/**
 * Initialize Redis subscriber for notifications
 */
function initRedisSubscriber(): void {
  if (!redis) {
    logger.error('Redis client not available for WebSocket server');
    return;
  }

  // Create a separate Redis client for subscriptions
  subscriber = redis.duplicate();

  // Subscribe to notification channel
  subscriber.subscribe(REDIS_CHANNELS.NOTIFICATIONS, (err) => {
    if (err) {
      logger.error('Error subscribing to Redis channel:', err);
      return;
    }
    logger.info(`Subscribed to Redis channel: ${REDIS_CHANNELS.NOTIFICATIONS}`);
  });

  // Handle messages from Redis
  subscriber.on('message', (channel, message) => {
    if (channel === REDIS_CHANNELS.NOTIFICATIONS) {
      try {
        const notification = JSON.parse(message);
        const userId = notification.userId;

        // Send notification to all connected clients for this user
        sendToUser(userId, {
          type: 'notification',
          data: notification,
        });
      } catch (error) {
        logger.error('Error handling Redis message:', error);
      }
    }
  });
}

/**
 * Authenticate a WebSocket connection
 * @param token The authentication token
 * @returns The user ID if authenticated, null otherwise
 */
async function authenticateConnection(token: string): Promise<string | null> {
  if (!token) {
    return null;
  }

  try {
    // Verify JWT token using the utility function
    return verifyWebSocketToken(token);
  } catch (error) {
    logger.error('WebSocket authentication error:', error);
    return null;
  }
}

/**
 * Handle a message from a client
 * @param userId The user ID
 * @param data The message data
 * @param ws The WebSocket connection
 */
function handleClientMessage(userId: string, data: any, ws: WebSocket): void {
  // Handle different message types
  switch (data.type) {
    case 'ping':
      // Respond to ping with pong
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;

    case 'mark_read':
      // Handle mark as read request
      // This would typically call the notification service
      logger.info(`User ${userId} marked notification ${data.id} as read`);
      break;

    default:
      logger.warn(`Unknown message type: ${data.type}`);
  }
}

/**
 * Send a message to all connected clients for a user
 * @param userId The user ID
 * @param data The message data
 */
export function sendToUser(userId: string, data: any): void {
  const userClients = clients.get(userId) || [];

  // Send message to all connected clients for this user
  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

/**
 * Close the WebSocket server
 */
export function closeWebSocketServer(): void {
  // Close all client connections
  clients.forEach((userClients) => {
    userClients.forEach((client) => {
      client.terminate();
    });
  });

  // Clear clients map
  clients.clear();

  // Close WebSocket server
  if (wss) {
    wss.close();
    wss = null;
  }

  // Unsubscribe and close Redis subscriber
  if (subscriber) {
    subscriber.unsubscribe();
    subscriber.quit();
    subscriber = null;
  }
}

// Export WebSocket server initialization
export default {
  initWebSocketServer,
  closeWebSocketServer,
  sendToUser,
};
