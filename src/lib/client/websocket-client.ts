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
      return;
    }

    this.setStatus(WebSocketStatus.CONNECTING);

    try {
      // Add token to URL as query parameter
      const url = new URL(this.options.url);
      url.searchParams.append('token', this.options.token);

      // Create WebSocket connection
      this.ws = new WebSocket(url.toString());

      // Set up event handlers
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);
    } catch (error) {
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
      console.warn('WebSocket is not connected');
      return;
    }

    try {
      this.ws.send(JSON.stringify(data));
    } catch (error) {
      console.error('Failed to send WebSocket message:', error);
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
      this.send({ type: 'ping', timestamp: Date.now() });
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
      console.error('Failed to parse WebSocket message:', error);
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
    console.error('WebSocket error:', event);
    this.setStatus(WebSocketStatus.ERROR);
    
    // Attempt to reconnect
    this.reconnect();
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private reconnect(): void {
    this.clearTimers();
    
    if (this.reconnectAttempts >= (this.options.maxReconnectAttempts || 5)) {
      this.setStatus(WebSocketStatus.DISCONNECTED);
      return;
    }
    
    this.reconnectAttempts++;
    this.setStatus(WebSocketStatus.RECONNECTING);
    
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
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
