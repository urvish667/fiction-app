/**
 * Notification queue implementation using BullMQ
 *
 * This module provides a queue for processing notifications using BullMQ and Redis.
 * It handles delayed notifications, retries, and error handling.
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import { redis } from './redis';
import { logger } from '@/lib/logger';
import { CreateNotificationParams } from './notification-service';

// Queue name
const QUEUE_NAME = 'notifications';

// Queue options
const QUEUE_OPTIONS = {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: 100, // Keep the last 100 failed jobs
  },
};

// Create notification queue instance
let queueInstance: Queue | null = null;

// Create worker
let worker: Worker | null = null;

// Create queue events
let queueEvents: QueueEvents | null = null;

/**
 * Initialize the notification queue
 * @param processor The function to process notifications
 */
export function initNotificationQueue(
  processor: (job: { data: CreateNotificationParams }) => Promise<any>
): Queue | null {
  if (!redis) {
    logger.warn('Redis client not available for notification queue');
    return null;
  }

  try {
    // Create queue
    queueInstance = new Queue(QUEUE_NAME, QUEUE_OPTIONS);

    // Create worker
    worker = new Worker(QUEUE_NAME, processor, {
      connection: redis,
      concurrency: 5,
    });

    // Create queue events
    queueEvents = new QueueEvents(QUEUE_NAME, {
      connection: redis,
    });

    // Handle worker events
    worker.on('completed', (job) => {
      logger.info(`Notification job ${job.id} completed`);
    });

    worker.on('failed', (job, error) => {
      logger.error(`Notification job ${job?.id} failed:`, error);
    });

    worker.on('error', (error) => {
      logger.error('Notification worker error:', error);
    });

    // Handle queue events
    queueEvents.on('completed', ({ jobId }) => {
      logger.debug(`Notification job ${jobId} completed (event)`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      logger.error(`Notification job ${jobId} failed (event):`, failedReason);
    });

    logger.info('Notification queue initialized');

    return queueInstance;
  } catch (error) {
    logger.error('Failed to initialize notification queue:', error);
    return null;
  }
}

/**
 * Add a notification to the queue
 * @param params The notification parameters
 * @param delay The delay in milliseconds
 * @returns The job ID
 */
export async function addToQueue(
  params: CreateNotificationParams,
  delay: number = 0
): Promise<string | null> {
  if (!queueInstance) {
    logger.error('Notification queue not initialized');
    return null;
  }

  try {
    const job = await queueInstance.add('notification', params, {
      delay,
    });

    logger.info(`Added notification to queue with ID ${job.id}`);

    return job.id;
  } catch (error) {
    logger.error('Failed to add notification to queue:', error);
    return null;
  }
}

/**
 * Close the notification queue
 */
export async function closeNotificationQueue(): Promise<void> {
  try {
    if (worker) {
      await worker.close();
      worker = null;
    }

    if (queueEvents) {
      await queueEvents.close();
      queueEvents = null;
    }

    if (queueInstance) {
      await queueInstance.close();
      queueInstance = null;
    }

    logger.info('Notification queue closed');
  } catch (error) {
    logger.error('Failed to close notification queue:', error);
  }
}

// Fallback in-memory queue for when Redis is not available
class InMemoryNotificationQueue {
  private queue: { params: CreateNotificationParams; delay: number; createdAt: number }[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processor: ((job: { data: CreateNotificationParams }) => Promise<any>) | null = null;

  /**
   * Set the processor function
   * @param processor The function to process notifications
   */
  setProcessor(processor: (job: { data: CreateNotificationParams }) => Promise<any>): void {
    this.processor = processor;
  }

  /**
   * Add a notification to the queue
   * @param params The notification parameters
   * @param delay The delay in milliseconds
   */
  enqueue(params: CreateNotificationParams, delay: number = 0): void {
    this.queue.push({
      params,
      delay,
      createdAt: Date.now(),
    });

    this.processQueue();
  }

  /**
   * Process the queue
   */
  private processQueue(): void {
    if (this.timer || !this.processor) {
      return;
    }

    this.timer = setInterval(() => {
      const now = Date.now();
      const readyNotifications = this.queue.filter(
        (item) => now - item.createdAt >= item.delay
      );

      // Remove ready notifications from queue
      this.queue = this.queue.filter(
        (item) => now - item.createdAt < item.delay
      );

      // Process ready notifications
      readyNotifications.forEach((item) => {
        this.processor!({ data: item.params })
          .catch((err) => {
            logger.error('Error processing notification:', err);
          });
      });

      // Clear timer if queue is empty
      if (this.queue.length === 0) {
        if (this.timer) {
          clearInterval(this.timer);
          this.timer = null;
        }
      }
    }, 1000);
  }
}

// Create in-memory queue
export const inMemoryQueue = new InMemoryNotificationQueue();

// Export queue
export const notificationQueue = {
  initNotificationQueue,
  addToQueue,
  closeNotificationQueue,
  inMemoryQueue,
};
