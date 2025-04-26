/**
 * Type definitions for the notification service
 */

/**
 * Parameters for creating a notification
 */
export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  content?: Record<string, any>;
}

/**
 * Notification object
 */
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  content?: Record<string, any>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * WebSocket message
 */
export interface WebSocketMessage {
  type: string;
  data: any;
}

/**
 * WebSocket client options
 */
export interface WebSocketClientOptions {
  url: string;
  token: string;
  onMessage?: (data: any) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

/**
 * WebSocket connection status
 */
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}
