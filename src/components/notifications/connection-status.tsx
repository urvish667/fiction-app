/**
 * Connection Status Indicator
 * 
 * Displays the current notification system connection status:
 * - Green dot: WebSocket connected (real-time)
 * - Yellow dot: Polling mode (fallback)
 * - Red dot: Offline/disconnected
 */

'use client';

import React from 'react';
import { useNotificationContext } from '@/contexts/notification-context';
import { ConnectionStatus, NotificationMode } from '@/lib/websocket/types';

export function ConnectionStatusIndicator() {
    const { mode, connectionStatus } = useNotificationContext();

    // Don't show indicator if offline
    if (mode === NotificationMode.OFFLINE) {
        return null;
    }

    const getStatusInfo = () => {
        if (mode === NotificationMode.WEBSOCKET && connectionStatus === ConnectionStatus.CONNECTED) {
            return {
                color: 'bg-green-500',
                text: 'Real-time',
                description: 'Connected via WebSocket for instant notifications',
            };
        }

        if (mode === NotificationMode.POLLING) {
            return {
                color: 'bg-yellow-500',
                text: 'Polling',
                description: 'Using fallback mode - notifications update every 30 seconds',
            };
        }

        if (connectionStatus === ConnectionStatus.RECONNECTING) {
            return {
                color: 'bg-orange-500 animate-pulse',
                text: 'Reconnecting',
                description: 'Attempting to reconnect to real-time service',
            };
        }

        return {
            color: 'bg-red-500',
            text: 'Offline',
            description: 'Connection lost - attempting to reconnect',
        };
    };

    const status = getStatusInfo();

    return (
        <div className="group relative inline-flex items-center gap-2">
            {/* Status dot */}
            <div className={`h-2 w-2 rounded-full ${status.color}`} />

            {/* Tooltip */}
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <div className="rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
                    <div className="font-semibold">{status.text}</div>
                    <div className="mt-1 max-w-xs text-gray-300">{status.description}</div>
                    {/* Arrow */}
                    <div className="absolute left-1/2 top-full -translate-x-1/2">
                        <div className="border-4 border-transparent border-t-gray-900" />
                    </div>
                </div>
            </div>
        </div>
    );
}
