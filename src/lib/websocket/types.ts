/**
 * WebSocket Message Types
 */

export enum WebSocketMessageType {
    // Incoming messages (from server)
    NOTIFICATION = 'notification',
    CONNECTION_STATUS = 'connection_status',
    PONG = 'pong',
    ERROR = 'error',
    NOTIFICATION_UPDATED = 'notification_updated',
    ALL_NOTIFICATIONS_UPDATED = 'all_notifications_updated',

    // Outgoing messages (to server)
    PING = 'ping',
    MARK_READ = 'MARK_READ',
    MARK_ALL_READ = 'MARK_ALL_READ',
}

export enum ConnectionStatus {
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    DISCONNECTED = 'disconnected',
    RECONNECTING = 'reconnecting',
    FAILED = 'failed',
}

export enum NotificationMode {
    WEBSOCKET = 'websocket',
    POLLING = 'polling',
    OFFLINE = 'offline',
}

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = any> {
    type: WebSocketMessageType;
    data: T;
}

/**
 * Connection status data
 */
export interface ConnectionStatusData {
    status: 'connected' | 'disconnected';
    userId?: string;
}

/**
 * Error data
 */
export interface ErrorData {
    message: string;
    timestamp: number;
}

/**
 * Notification update data
 */
export interface NotificationUpdateData {
    id: string;
    read: boolean;
    timestamp: number;
}

/**
 * WebSocket client configuration
 */
export interface WebSocketConfig {
    url: string;
    enabled: boolean;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    heartbeatInterval: number;
    connectionTimeout: number;
}

/**
 * WebSocket client events
 */
export interface WebSocketEvents {
    onConnect: () => void;
    onDisconnect: () => void;
    onNotification: (notification: any) => void;
    onError: (error: Error) => void;
    onReconnecting: (attempt: number) => void;
    onReconnectFailed: () => void;
}
