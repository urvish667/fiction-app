/**
 * WebSocket Notification Client
 * 
 * Handles WebSocket connections to the notification service with:
 * - Automatic reconnection with exponential backoff
 * - Heartbeat/ping-pong mechanism
 * - Event-based notification delivery
 * - Connection state management
 */

import { logError, logInfo, logWarning } from '@/lib/error-logger';
import {
    WebSocketMessageType,
    ConnectionStatus,
    WebSocketMessage,
    WebSocketConfig,
    WebSocketEvents,
    ConnectionStatusData,
    ErrorData,
} from './types';

export class NotificationWebSocketClient {
    private ws: WebSocket | null = null;
    private config: WebSocketConfig;
    private events: Partial<WebSocketEvents>;
    private reconnectAttempts = 0;
    private reconnectTimer: NodeJS.Timeout | null = null;
    private heartbeatTimer: NodeJS.Timeout | null = null;
    private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
    private token: string | null = null;
    private isIntentionallyClosed = false;

    constructor(config: WebSocketConfig, events: Partial<WebSocketEvents> = {}) {
        this.config = config;
        this.events = events;
    }

    /**
     * Connect to WebSocket server
     */
    public async connect(token: string): Promise<void> {
        if (!this.config.enabled) {
            logInfo('WebSocket is disabled in configuration');
            return;
        }

        if (this.ws?.readyState === WebSocket.OPEN) {
            logInfo('WebSocket already connected');
            return;
        }

        this.token = token;
        this.isIntentionallyClosed = false;
        this.setConnectionStatus(ConnectionStatus.CONNECTING);

        try {
            const wsUrl = `${this.config.url}?token=${token}`;
            logInfo(`Connecting to WebSocket: ${this.config.url}`);

            this.ws = new WebSocket(wsUrl);

            // Set up event handlers
            this.ws.onopen = this.handleOpen.bind(this);
            this.ws.onmessage = this.handleMessage.bind(this);
            this.ws.onerror = this.handleError.bind(this);
            this.ws.onclose = this.handleClose.bind(this);

            // Connection timeout
            setTimeout(() => {
                if (this.connectionStatus === ConnectionStatus.CONNECTING) {
                    logWarning('WebSocket connection timeout');
                    this.ws?.close();
                    this.handleReconnect();
                }
            }, this.config.connectionTimeout);

        } catch (error) {
            logError(error, { context: 'WebSocket connection failed' });
            this.setConnectionStatus(ConnectionStatus.FAILED);
            this.events.onError?.(error instanceof Error ? error : new Error('WebSocket connection failed'));
            this.handleReconnect();
        }
    }

    /**
     * Disconnect from WebSocket server
     */
    public disconnect(): void {
        this.isIntentionallyClosed = true;
        this.clearTimers();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
        logInfo('WebSocket disconnected intentionally');
    }

    /**
     * Send a message to the server
     */
    public send(message: WebSocketMessage): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(message));
        } else {
            logWarning('Cannot send message: WebSocket not connected');
        }
    }

    /**
     * Mark notification as read
     */
    public markAsRead(notificationId: string): void {
        this.send({
            type: WebSocketMessageType.MARK_READ,
            data: { id: notificationId },
        });
    }

    /**
     * Mark all notifications as read
     */
    public markAllAsRead(): void {
        this.send({
            type: WebSocketMessageType.MARK_ALL_READ,
            data: {},
        });
    }

    /**
     * Get current connection status
     */
    public getConnectionStatus(): ConnectionStatus {
        return this.connectionStatus;
    }

    /**
     * Check if connected
     */
    public isConnected(): boolean {
        return this.connectionStatus === ConnectionStatus.CONNECTED;
    }

    /**
     * Handle WebSocket open event
     */
    private handleOpen(): void {
        logInfo('WebSocket connected successfully');
        this.setConnectionStatus(ConnectionStatus.CONNECTED);
        this.reconnectAttempts = 0;
        this.events.onConnect?.();
        this.startHeartbeat();
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleMessage(event: MessageEvent): void {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);

            switch (message.type) {
                case WebSocketMessageType.NOTIFICATION:
                    logInfo('Received notification via WebSocket', { notification: message.data });
                    this.events.onNotification?.(message.data);
                    break;

                case WebSocketMessageType.CONNECTION_STATUS:
                    const statusData = message.data as ConnectionStatusData;
                    logInfo('Connection status update', { status: statusData });
                    break;

                case WebSocketMessageType.PONG:
                    // Heartbeat response received
                    break;

                case WebSocketMessageType.ERROR:
                    const errorData = message.data as ErrorData;
                    logError(new Error(errorData.message), { context: 'WebSocket server error' });
                    this.events.onError?.(new Error(errorData.message));
                    break;

                case WebSocketMessageType.NOTIFICATION_UPDATED:
                case WebSocketMessageType.ALL_NOTIFICATIONS_UPDATED:
                    // Notification update confirmation
                    logInfo('Notification update confirmed', { data: message.data });
                    break;

                default:
                    logWarning('Unknown WebSocket message type', { type: message.type });
            }
        } catch (error) {
            logError(error, { context: 'Failed to parse WebSocket message' });
        }
    }

    /**
     * Handle WebSocket error event
     */
    private handleError(event: Event): void {
        logError(new Error('WebSocket error'), { event });
        this.events.onError?.(new Error('WebSocket connection error'));
    }

    /**
     * Handle WebSocket close event
     */
    private handleClose(event: CloseEvent): void {
        logInfo('WebSocket connection closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
        });

        this.clearTimers();
        this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
        this.events.onDisconnect?.();

        // Attempt reconnection if not intentionally closed
        if (!this.isIntentionallyClosed) {
            this.handleReconnect();
        }
    }

    /**
     * Handle reconnection logic with exponential backoff
     */
    private handleReconnect(): void {
        if (this.isIntentionallyClosed) {
            return;
        }

        if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
            logWarning('Max reconnection attempts reached');
            this.setConnectionStatus(ConnectionStatus.FAILED);
            this.events.onReconnectFailed?.();
            return;
        }

        this.reconnectAttempts++;
        this.setConnectionStatus(ConnectionStatus.RECONNECTING);
        this.events.onReconnecting?.(this.reconnectAttempts);

        // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s (max)
        const delay = Math.min(
            this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
            30000
        );

        logInfo(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.config.maxReconnectAttempts})`);

        this.reconnectTimer = setTimeout(() => {
            if (this.token) {
                this.connect(this.token);
            }
        }, delay);
    }

    /**
     * Start heartbeat mechanism
     */
    private startHeartbeat(): void {
        this.clearHeartbeat();

        this.heartbeatTimer = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.send({
                    type: WebSocketMessageType.PING,
                    data: { timestamp: Date.now() },
                });
            }
        }, this.config.heartbeatInterval);
    }

    /**
     * Clear heartbeat timer
     */
    private clearHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }

    /**
     * Clear all timers
     */
    private clearTimers(): void {
        this.clearHeartbeat();

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }

    /**
     * Set connection status and log
     */
    private setConnectionStatus(status: ConnectionStatus): void {
        this.connectionStatus = status;
        logInfo(`WebSocket status: ${status}`);
    }
}

/**
 * Create a configured WebSocket client instance
 */
export function createNotificationWebSocketClient(
    events: Partial<WebSocketEvents> = {}
): NotificationWebSocketClient {
    const config: WebSocketConfig = {
        url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/api/ws',
        enabled: process.env.NEXT_PUBLIC_WS_ENABLED !== 'false',
        reconnectInterval: 1000, // 1 second base interval
        maxReconnectAttempts: 10,
        heartbeatInterval: 30000, // 30 seconds
        connectionTimeout: 10000, // 10 seconds
    };

    return new NotificationWebSocketClient(config, events);
}
