/**
 * Input validation utilities for WebSocket messages
 *
 * This module provides validation functions for WebSocket messages
 * to ensure they conform to expected formats and prevent injection attacks.
 */

import { logger } from './logger';

// Message types
export enum MessageType {
  PING = 'ping',
  MARK_READ = 'mark_read',
  MARK_ALL_READ = 'mark_all_read',
}

// Message schemas
interface BaseMessage {
  type: string;
}

interface PingMessage extends BaseMessage {
  type: MessageType.PING;
}

interface MarkReadMessage extends BaseMessage {
  type: MessageType.MARK_READ;
  id: string;
}

interface MarkAllReadMessage extends BaseMessage {
  type: MessageType.MARK_ALL_READ;
}

// Union type for all message types
export type WebSocketClientMessage = PingMessage | MarkReadMessage | MarkAllReadMessage;

/**
 * Validate a WebSocket message
 * @param data The message data
 * @returns The validated message or null if invalid
 */
export function validateMessage(data: any): WebSocketClientMessage | null {
  // Check if data is an object
  if (!data || typeof data !== 'object') {
    logger.warn('Invalid message format: not an object');
    return null;
  }

  // Check if type is valid
  if (!data.type || typeof data.type !== 'string') {
    logger.warn('Invalid message format: missing or invalid type');
    return null;
  }

  // Validate based on message type
  switch (data.type) {
    case MessageType.PING:
      return validatePingMessage(data);
    case MessageType.MARK_READ:
      return validateMarkReadMessage(data);
    case MessageType.MARK_ALL_READ:
      return validateMarkAllReadMessage(data);
    default:
      logger.warn(`Unknown message type: ${data.type}`);
      return null;
  }
}

/**
 * Validate a ping message
 * @param data The message data
 * @returns The validated message or null if invalid
 */
function validatePingMessage(data: any): PingMessage | null {
  // No additional fields required
  return { type: MessageType.PING };
}

/**
 * Validate a mark read message
 * @param data The message data
 * @returns The validated message or null if invalid
 */
function validateMarkReadMessage(data: any): MarkReadMessage | null {
  // Check if id is valid
  if (!data.id || typeof data.id !== 'string') {
    logger.warn('Invalid mark_read message: missing or invalid id');
    return null;
  }

  // Sanitize id (prevent injection)
  const id = data.id.trim();
  if (!id.match(/^[a-zA-Z0-9-]+$/)) {
    logger.warn(`Invalid mark_read message: id contains invalid characters: ${id}`);
    return null;
  }

  return {
    type: MessageType.MARK_READ,
    id,
  };
}

/**
 * Validate a mark all read message
 * @param data The message data
 * @returns The validated message or null if invalid
 */
function validateMarkAllReadMessage(data: any): MarkAllReadMessage | null {
  // No additional fields required
  return { type: MessageType.MARK_ALL_READ };
}
