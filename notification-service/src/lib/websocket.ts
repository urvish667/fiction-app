/**
 * WebSocket server for real-time notifications
 *
 * This module provides a WebSocket server for real-time notifications.
 * It handles client connections, authentication, and message routing.
 */

import { Redis } from 'ioredis';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import { logger } from './logger';
import { redis, REDIS_CHANNELS } from './redis';
import { verifyWebSocketToken } from './auth/ws-auth';
import { WebSocketMessage } from './types';
import { isRateLimited } from './rate-limit';
import { validateMessage, MessageType } from './validation';

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

  // Handle HTTP server upgrade requests
  server.on('upgrade', (request, socket, head) => {
    // Parse URL to get query parameters
    const { pathname, query } = parse(request.url || '', true);

    // Check if this is a WebSocket request
    if (pathname === '/api/ws') {
      // Get client IP address
      const ip = getClientIp(request);

      // Check rate limiting
      const rateLimitResult = isRateLimited(ip);
      if (rateLimitResult.limited) {
        logger.warn(`Rate limit exceeded for IP ${ip}`);
        socket.write('HTTP/1.1 429 Too Many Requests\r\n');
        socket.write(`Retry-After: ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)}\r\n\r\n`);
        socket.destroy();
        return;
      }

      // Get token from query parameters
      const token = query.token as string;

      if (!token) {
        logger.warn(`WebSocket connection attempt without token from IP ${ip}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Verify token
      const userId = verifyWebSocketToken(token);

      if (!userId) {
        logger.warn(`WebSocket connection attempt with invalid token from IP ${ip}`);
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Add security headers
      const securityHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        'Strict-Transport-Security: max-age=31536000; includeSubDomains',
        'X-Content-Type-Options: nosniff',
        'X-XSS-Protection: 1; mode=block',
      ];

      // Upgrade connection to WebSocket with security headers
      wss?.handleUpgrade(request, socket, head, (ws) => {
        wss?.emit('connection', ws, request, userId);
      });
    } else {
      // Not a WebSocket request
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
        // Limit message size to prevent DoS attacks
        if (message.length > 4096) {
          logger.warn(`Received oversized message from user ${userId}: ${message.length} bytes`);
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Message too large',
              timestamp: Date.now(),
            },
          }));
          return;
        }

        // Parse message
        let data;
        try {
          data = JSON.parse(message.toString());
        } catch (parseError) {
          logger.warn(`Invalid JSON from user ${userId}`);
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Invalid JSON format',
              timestamp: Date.now(),
            },
          }));
          return;
        }

        // Handle message
        handleClientMessage(userId, data, ws);
      } catch (error) {
        logger.error('Error handling WebSocket message:', error);

        // Send generic error to client
        try {
          ws.send(JSON.stringify({
            type: 'error',
            data: {
              message: 'Server error processing message',
              timestamp: Date.now(),
            },
          }));
        } catch (sendError) {
          logger.error('Error sending error message:', sendError);
        }
      }
    });

    // Handle client disconnection
    ws.on('close', () => {
      logger.info(`WebSocket connection closed for user ${userId}`);

      // Remove client from clients map
      const userClients = clients.get(userId);
      if (userClients) {
        const index = userClients.indexOf(ws);
        if (index !== -1) {
          userClients.splice(index, 1);
        }

        // Remove user from clients map if no more connections
        if (userClients.length === 0) {
          clients.delete(userId);
        }
      }

      // Clear ping interval
      clearInterval(pingInterval);
    });

    // Handle client errors
    ws.on('error', (error) => {
      logger.error(`WebSocket error for user ${userId}:`, error);
    });

    // Send initial connection status
    ws.send(JSON.stringify({
      type: 'connection_status',
      data: {
        status: 'connected',
        userId,
      },
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
  try {
    // Create a new Redis client for subscriptions
    const host = process.env.REDIS_HOST;
    const port = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6380;
    const password = process.env.REDIS_PASSWORD;
    const tls = process.env.REDIS_TLS === 'true';

    if (!host || !password) {
      logger.error('Redis configuration is incomplete. REDIS_HOST and REDIS_PASSWORD are required.');
      return;
    }

    // Construct Redis URL
    const protocol = tls ? 'rediss' : 'redis';
    const redisUrl = `${protocol}://:${password}@${host}:${port}`;

    // Create Redis client
    subscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times: number) => {
        // Exponential backoff with max 1 second
        return Math.min(times * 100, 1000);
      },
      enableReadyCheck: true,
      reconnectOnError: (err: Error) => {
        const targetError = 'READONLY';
        if (err.message.includes(targetError)) {
          // Only reconnect when the error contains "READONLY"
          return true;
        }
        return false;
      },
    });

    // Subscribe to notification channel
    subscriber.subscribe(REDIS_CHANNELS.NOTIFICATIONS, (err) => {
      if (err) {
        logger.error('Error subscribing to Redis channel:', err);
        return;
      }
      logger.info(`Subscribed to Redis channel: ${REDIS_CHANNELS.NOTIFICATIONS}`);
    });
  } catch (error) {
    logger.error('Failed to create Redis subscriber:', error);
    return;
  }

  // Handle messages from Redis
  subscriber.on('message', (channel, message) => {
    if (channel === REDIS_CHANNELS.NOTIFICATIONS) {
      try {
        const notification = JSON.parse(message);
        const userId = notification.userId;

        // Send notification to all connected clients for this user
        sendToUser(userId, {
          type: 'notification',
          data: notification.notification || notification,
        });
      } catch (error) {
        logger.error('Error handling Redis message:', error);
      }
    }
  });

  // Handle Redis errors
  subscriber.on('error', (error) => {
    logger.error('Redis subscriber error:', error);
  });
}

/**
 * Handle client messages
 * @param userId The user ID
 * @param data The message data
 * @param ws The WebSocket connection
 */
function handleClientMessage(userId: string, data: any, ws: WebSocket): void {
  logger.debug(`Received message from user ${userId}`);

  // Validate message
  const validatedMessage = validateMessage(data);
  if (!validatedMessage) {
    logger.warn(`Invalid message from user ${userId}`);
    // Send error response
    ws.send(JSON.stringify({
      type: 'error',
      data: {
        message: 'Invalid message format',
        timestamp: Date.now(),
      },
    }));
    return;
  }

  // Handle different message types
  switch (validatedMessage.type) {
    case MessageType.PING:
      // Respond to ping
      ws.send(JSON.stringify({
        type: 'pong',
        data: {
          timestamp: Date.now(),
        },
      }));
      break;

    case MessageType.MARK_READ:
      // Handle mark as read
      // This is just a placeholder - the actual implementation would
      // update the database and publish to Redis
      logger.debug(`User ${userId} marked notification ${validatedMessage.id} as read`);

      // Send confirmation
      ws.send(JSON.stringify({
        type: 'notification_updated',
        data: {
          id: validatedMessage.id,
          read: true,
          timestamp: Date.now(),
        },
      }));
      break;

    case MessageType.MARK_ALL_READ:
      // Handle mark all as read
      logger.debug(`User ${userId} marked all notifications as read`);

      // Send confirmation
      ws.send(JSON.stringify({
        type: 'all_notifications_updated',
        data: {
          read: true,
          timestamp: Date.now(),
        },
      }));
      break;

    default:
      // This shouldn't happen due to validation, but just in case
      logger.warn(`Unknown message type from user ${userId}`);

      // Send error response
      ws.send(JSON.stringify({
        type: 'error',
        data: {
          message: 'Unknown message type',
          timestamp: Date.now(),
        },
      }));
  }
}

/**
 * Send a message to a specific user
 * @param userId The user ID
 * @param message The message to send
 */
export function sendToUser(userId: string, message: WebSocketMessage): void {
  const userClients = clients.get(userId);

  if (!userClients || userClients.length === 0) {
    logger.debug(`No active WebSocket connections for user ${userId}`);
    return;
  }

  const messageString = JSON.stringify(message);

  // Send message to all connections for this user
  userClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageString);
    }
  });

  logger.debug(`Sent message to user ${userId} (${userClients.length} connections)`);
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

  logger.info('WebSocket server closed');
}

/**
 * Get client IP address from request
 * @param req The HTTP request
 * @returns The client IP address
 */
function getClientIp(req: IncomingMessage): string {
  // Get IP from X-Forwarded-For header (if behind proxy)
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For can be a comma-separated list of IPs
    // The client's IP is the first one in the list
    const ips = Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(',')[0].trim();
    return ips;
  }

  // Fall back to socket remote address
  return (req.socket.remoteAddress || '0.0.0.0').replace(/^::ffff:/, '');
}

// Export WebSocket server functions
export default {
  initWebSocketServer,
  closeWebSocketServer,
  sendToUser,
};
