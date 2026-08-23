"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/layout"
import { useRequireAuth } from "@/features/auth"
import { useNotifications } from "../hooks/use-notifications"
import { NotificationHeader } from "./notification-header"
import { NotificationItem } from "./notification-item"
import { NotificationEmptyState } from "./notification-empty-state"
import { NotificationSkeleton } from "./notification-skeleton"

export function NotificationsPageClient() {
  const { user, isLoading: isAuthLoading } = useRequireAuth()
  const {
    filteredNotifications,
    markAsReadAndDelete,
    markAllAsRead,
    loading,
    error,
    loadMoreNotifications,
    hasMore,
    isLoadingMore,
    refetch,
  } = useNotifications()

  // Refetch notifications on mount if user is present
  useEffect(() => {
    if (user) {
      refetch()
    }
  }, [user, refetch])

  const [deletingNotifications, setDeletingNotifications] = useState<Set<string>>(new Set())

  const handleDeleteNotification = async (id: string) => {
    setDeletingNotifications((prev) => new Set(prev).add(id))

    setTimeout(async () => {
      await markAsReadAndDelete(id)
      setDeletingNotifications((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 300)
  }

  const markAllAsReadAndDismiss = async () => {
    await markAllAsRead()
    const unreadNotifications = filteredNotifications.filter((n: any) => !n.read)
    for (const notification of unreadNotifications) {
      await handleDeleteNotification(notification.id)
    }
  }

  // Guard: Auth loading state
  if (isAuthLoading) {
    return (
      <TooltipProvider>
        <div className="min-h-screen">
          <Navbar />
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
          </div>
        </div>
      </TooltipProvider>
    )
  }

  const hasUnread = filteredNotifications.some((n: any) => !n.read)

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <Navbar />

        <main className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <NotificationHeader
              onMarkAllAsRead={markAllAsReadAndDismiss}
              hasUnread={hasUnread}
            />

            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
                <p>Error: {error}</p>
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mt-6"
            >
              {loading ? (
                <NotificationSkeleton />
              ) : filteredNotifications.length > 0 ? (
                <div>
                  <AnimatePresence mode="popLayout">
                    {filteredNotifications.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        isDeleting={deletingNotifications.has(notification.id)}
                        onDelete={handleDeleteNotification}
                      />
                    ))}
                  </AnimatePresence>

                  {hasMore && (
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={loadMoreNotifications}
                        disabled={isLoadingMore}
                      >
                        {isLoadingMore ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2" />
                            Loading...
                          </>
                        ) : (
                          "Load More Notifications"
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <NotificationEmptyState />
              )}
            </motion.div>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default NotificationsPageClient
