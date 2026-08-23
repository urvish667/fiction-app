"use client"

import { useNotificationContext } from "@/contexts/notification-context"

/**
 * Lightweight hook for accessing only the unread notification count
 * Reads directly from NotificationContext to avoid redundant API calls
 */
export function useUnreadNotificationCount() {
  const { unreadCount, loading, error, refetch } = useNotificationContext()

  return {
    unreadCount,
    loading,
    error,
    refetch,
  }
}

export default useUnreadNotificationCount
