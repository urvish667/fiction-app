/**
 * FableSpace Notification Service
 *
 * This is the main entry point for the notification service.
 * It initializes the WebSocket server and notification queue.
 */

import dotenv from 'dotenv';
import { logger } from './lib/logger';
import { initWebSocketServer, closeWebSocketServer } from './lib/websocket';
import { notificationQueue } from './lib/notification-queue';
import { CreateNotificationParams } from './lib/types';

// Load environment variables
dotenv.config();

// Get port from environment or use default
const port = parseInt(process.env.WS_PORT || '3001', 10);

/**
 * Initialize the notification system
 */
function initNotificationSystem(): void {
  // Initialize notification queue with processor
  notificationQueue.initNotificationQueue(async (job) => {
    // This would normally create a notification in the database
    // and then publish it to Redis for real-time delivery
    logger.info(`Processing notification job: ${JSON.stringify(job.data)}`);
    return job.data;
  });

  // Initialize WebSocket server
  initWebSocketServer(port);

  logger.info('Notification system initialized');
}

/**
 * Shutdown handler
 */
async function shutdown(): Promise<void> {
  logger.info('Shutting down notification service...');

  // Close WebSocket server
  closeWebSocketServer();

  // Close notification queue
  await notificationQueue.closeNotificationQueue();

  logger.info('Notification service shutdown complete');
  process.exit(0);
}

// Handle process termination
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Initialize notification system
initNotificationSystem();

logger.info(`Notification service running on port ${port}. Press Ctrl+C to stop.`);
