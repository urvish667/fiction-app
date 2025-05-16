/**
 * WebSocket client for real-time notifications
 *
 * This module provides a WebSocket client for real-time notifications.
 * It handles connection management, reconnection, and message handling.
 */

import { logger } from '@/lib/logger';


// WebSocket connection status
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error',
}

// WebSocket client options
export interface WebSocketClientOptions {
  url: string;
  token: string;
  onMessage?: (data: any) => void;
  onStatusChange?: (status: WebSocketStatus) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

// WebSocket client class
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private status: WebSocketStatus = WebSocketStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private options: WebSocketClientOptions;

  constructor(options: WebSocketClientOptions) {
    this.options = {
      reconnectInterval: 2000,
      maxReconnectAttempts: 5,
      ...options,
    };
  }

  /**
   * Connect to the WebSocket server
   */
  public connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      logger.info('WebSocket already connected or connecting, skipping connection attempt');
      return;
    }

    // Check if the page is visible
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      logger.info('Page is not visible, delaying WebSocket connection');
      // Set up a visibility change listener to connect when the page becomes visible
      const visibilityListener = () => {
        if (document.visibilityState === 'visible') {
          logger.info('Page became visible, connecting WebSocket');
          document.removeEventListener('visibilitychange', visibilityListener);
          this.connect();
        }
      };
      document.addEventListener('visibilitychange', visibilityListener);
      return;
    }

    this.setStatus(WebSocketStatus.CONNECTING);
    logger.info('Connecting to WebSocket server...');

    try {
      // Add token to URL as query parameter
      const url = new URL(this.options.url);
      url.searchParams.append('token', this.options.token);

      // Log connection URL (without showing the full token for security)
      const urlString = url.toString();
      const tokenIndex = urlString.indexOf('token=');
      const safeUrl = tokenIndex > 0
        ? urlString.substring(0, tokenIndex + 6) + '***'
        : urlString;
      logger.info(`Connecting to WebSocket URL: ${safeUrl}`);

      // Create WebSocket connection
      this.ws = new WebSocket(url.toString());

      // Set up event handlers
      this.ws.onopen = (event) => {
        logger.info('WebSocket connection opened');
        this.handleOpen();
      };

      this.ws.onmessage = (event) => {
        // Don't log every message to avoid console spam
        this.handleMessage(event);
      };

      this.ws.onclose = (event) => {
        logger.info('WebSocket connection closed');
        this.handleClose();
      };

      this.ws.onerror = (event) => {
        logger.error('WebSocket connection error:', event);
        this.handleError(event);
      };
    } catch (error) {
      logger.error('Error creating WebSocket connection:', error);
      this.handleError(error as Event);
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.clearTimers();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;

      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }

      this.ws = null;
    }

    this.setStatus(WebSocketStatus.DISCONNECTED);
  }

  /**
   * Send a message to the WebSocket server
   * @param data The message data
   */
  public send(data: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      logger.warn('WebSocket is not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to send WebSocket message:', error);
    }
  }

  /**
   * Get the current WebSocket status
   * @returns The current WebSocket status
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.reconnectAttempts = 0;
    this.setStatus(WebSocketStatus.CONNECTED);

    // Set up ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      // Only send ping if the page is visible or if we're in a non-browser environment
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        this.send({ type: 'ping', timestamp: Date.now() });
      } else {
        logger.info('Skipping WebSocket ping - page not visible');
      }
    }, 30000);
  }

  /**
   * Handle WebSocket message event
   * @param event The message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);

      // Call onMessage callback if provided
      if (this.options.onMessage) {
        this.options.onMessage(data);
      }
    } catch (error) {
      logger.error('Failed to parse WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(): void {
    this.clearTimers();

    // Attempt to reconnect if not explicitly disconnected
    if (this.status !== WebSocketStatus.DISCONNECTED) {
      this.reconnect();
    }
  }

  /**
   * Handle WebSocket error event
   * @param event The error event
   */
  private handleError(event: Event): void {
    // Log more detailed error information
    logger.error('WebSocket error:', event);

    this.setStatus(WebSocketStatus.ERROR);

    // Attempt to reconnect
    this.reconnect();
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private reconnect(): void {
    this.clearTimers();

    const maxAttempts = this.options.maxReconnectAttempts || 5;

    if (this.reconnectAttempts >= maxAttempts) {
      logger.error(`Maximum reconnect attempts (${maxAttempts}) reached. Giving up.`);
      this.setStatus(WebSocketStatus.DISCONNECTED);
      return;
    }

    this.reconnectAttempts++;
    this.setStatus(WebSocketStatus.RECONNECTING);

    const delay = this.options.reconnectInterval || 2000;
    logger.info(`Attempting to reconnect (attempt ${this.reconnectAttempts}/${maxAttempts}) in ${delay}ms...`);

    this.reconnectTimeout = setTimeout(() => {
      // Check if the page is visible before reconnecting
      if (typeof document === 'undefined' || document.visibilityState === 'visible') {
        logger.info(`Reconnecting now (attempt ${this.reconnectAttempts}/${maxAttempts})...`);
        this.connect();
      } else {
        logger.info(`Delaying reconnect (attempt ${this.reconnectAttempts}/${maxAttempts}) - page not visible`);

        // Set up a visibility change listener to reconnect when the page becomes visible
        const visibilityListener = () => {
          if (document.visibilityState === 'visible') {
            logger.info('Page became visible, attempting reconnect');
            document.removeEventListener('visibilitychange', visibilityListener);
            this.connect();
          }
        };
        document.addEventListener('visibilitychange', visibilityListener);
      }
    }, delay);
  }

  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Set the WebSocket status and call the onStatusChange callback if provided
   * @param status The new WebSocket status
   */
  private setStatus(status: WebSocketStatus): void {
    this.status = status;

    // Call onStatusChange callback if provided
    if (this.options.onStatusChange) {
      this.options.onStatusChange(status);
    }
  }
}

// Create a singleton WebSocket client
let wsClient: WebSocketClient | null = null;

/**
 * Get the WebSocket client instance
 * @param options The WebSocket client options
 * @returns The WebSocket client instance
 */
export function getWebSocketClient(options?: WebSocketClientOptions): WebSocketClient | null {
  // Return existing client if available
  if (wsClient) {
    return wsClient;
  }

  // Create new client if options are provided
  if (options) {
    wsClient = new WebSocketClient(options);
    return wsClient;
  }

  return null;
}

/**
 * Close the WebSocket client
 */
export function closeWebSocketClient(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}

export default {
  WebSocketClient,
  getWebSocketClient,
  closeWebSocketClient,
  WebSocketStatus,
};
