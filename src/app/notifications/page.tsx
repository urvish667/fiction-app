"use client"

import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Bell, Heart, MessageSquare, UserPlus, BookOpen, Check } from "lucide-react"
import Navbar from "@/components/navbar"
import { useNotifications } from "@/hooks/use-notifications"
import { formatRelativeTime } from "@/utils/date-utils"


export default function NotificationsPage() {
  const {
    filteredNotifications,
    markAsReadAndDelete,
    loading,
    error,
    loadMoreNotifications,
    hasMore,
    isLoadingMore,
  } = useNotifications()

  // Track notifications being deleted for animation
  const [deletingNotifications, setDeletingNotifications] = useState<Set<string>>(new Set())

  // Handle notification deletion with animation
  const handleDeleteNotification = async (id: string) => {
    // Add to deleting set to trigger animation
    setDeletingNotifications(prev => new Set(prev).add(id))

    // Wait for animation to complete, then delete
    setTimeout(async () => {
      await markAsReadAndDelete(id)
      // Remove from deleting set after deletion
      setDeletingNotifications(prev => {
        const newSet = new Set(prev)
        newSet.delete(id)
        return newSet
      })
    }, 300) // Animation duration
  }

  // Mark all unread notifications as read and dismiss them
  const markAllAsReadAndDismiss = async () => {
    const unreadNotifications = filteredNotifications.filter((n: any) => !n.read)

    // Process each unread notification with animation
    for (const notification of unreadNotifications) {
      await handleDeleteNotification(notification.id)
    }
  }

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
      case "chapter_like":
      case "comment_like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
      case "chapter_comment":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "reply":
      case "chapter_reply":
        return <MessageSquare className="h-4 w-4 text-blue-500" />
      case "follow":
        return <UserPlus className="h-4 w-4 text-green-500" />
      case "chapter":
        return <BookOpen className="h-4 w-4 text-purple-500" />
      case "donation":
        return <span className="h-4 w-4 text-amber-500 flex items-center justify-center font-bold">$</span>
      case "system":
        return <Bell className="h-4 w-4 text-blue-400" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Get notification content
  const getNotificationContent = (notification: any) => {
    // Use actor username or fallback to 'Someone'
    const username = notification.actor?.username || 'Someone';

    switch (notification.type) {
      case "like":
        if (!notification.content) return notification.message || 'Someone liked your story';
        return (
          <>
            <Link href={`/user/${username}`} className="font-medium hover:text-primary">
              {username}
            </Link>
            {" liked your story "}
            <Link href={`/story/${notification.content.storySlug || notification.content.storyId}`} className="font-medium hover:text-primary">
              {notification.content.storyTitle}
            </Link>
          </>
        )
      case "comment":
        if (!notification.content) return notification.message || 'Someone commented on your story';
        return (
          <>
            <Link href={`/user/${username}`} className="font-medium hover:text-primary">
              {username}
            </Link>
            {" commented on your story "}
            <Link href={`/story/${notification.content.storySlug || notification.content.storyId}`} className="font-medium hover:text-primary">
              {notification.content.storyTitle}
            </Link>
            {notification.content.comment && (
              <div className="mt-1 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                {notification.content.comment}
              </div>
            )}
          </>
        )
      case "chapter_like":
        if (!notification.content) return notification.message || 'Someone liked your chapter';
        return (
          <>
            <Link href={`/user/${username}`} className="font-medium hover:text-primary">
              {username}
            </Link>
            {" liked your chapter "}
            <Link href={`/story/${notification.content.storySlug || notification.content.storyId}/chapter/${notification.content.chapterNumber}`} className="font-medium hover:text-primary">
              {notification.content.chapterTitle}
            </Link>
          </>
        )
      case "chapter_comment":
        if (!notification.content) return notification.message || 'Someone commented on your chapter';
        return (
          <>
            <Link href={`/user/${username}`} className="font-medium hover:text-primary">
              {username}
            </Link>
            {" commented on your chapter "}
            <Link href={`/story/${notification.content.storySlug || notification.content.storyId}/chapter/${notification.content.chapterNumber}`} className="font-medium hover:text-primary">
              {notification.content.chapterTitle}
            </Link>
            {notification.content.comment && (
              <div className="mt-1 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                {notification.content.comment}
              </div>
            )}
          </>
        )
      case "comment_like":
        if (!notification.content) return notification.message || 'Someone liked your comment';
        return (
          <>
            <Link href={`/user/${username}`} className="font-medium hover:text-primary">
              {username}
            </Link>
            {" liked your comment"}
            {notification.content.storyId && (
              <>
                {" on "}
                <Link href={`/story/${notification.content.storySlug || notification.content.storyId}`} className="font-medium hover:text-primary">
                  {notification.content.storyTitle}
                </Link>
              </>
            )}
          </>
        )
      case "reply":
      case "chapter_reply":
        if (!notification.content) return notification.message || 'Someone replied to your comment';
        return (
          <>
            <Link href={`/user/${username}`} className="font-medium hover:text-primary">
              {username}
            </Link>
            {" replied to your comment"}
            {notification.content.storyId && (
              <>
                {" on "}
                <Link href={`/story/${notification.content.storySlug || notification.content.storyId}${notification.content.chapterId ? `/chapter/${notification.content.chapterNumber}` : ''}`} className="font-medium hover:text-primary">
                  {notification.content.chapterTitle || notification.content.storyTitle}
                </Link>
              </>
            )}
            {notification.content.comment && (
              <div className="mt-1 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                {notification.content.comment}
              </div>
            )}
          </>
        )
      case "follow":
        return (
          <>
            <Link href={`/user/${username}`} className="font-medium hover:text-primary">
              {username}
            </Link>
            {" started following you"}
          </>
        )
      // case "chapter":
      //   if (!notification.content) return notification.message || 'New chapter published';
      //   return (
      //     <>
      //       <span className="font-medium">{userName}</span>
      //       {" published a new chapter: "}
      //       <Link
      //         href={`/story/${notification.content.storySlug || notification.content.storyId}/chapter/${notification.content.chapterNumber}`}
      //         className="font-medium hover:text-primary"
      //       >
      //         Chapter {notification.content.chapterNumber}: {notification.content.chapterTitle}
      //       </Link>
      //       {" in "}
      //       <Link href={`/story/${notification.content.storySlug || notification.content.storyId}`} className="font-medium hover:text-primary">
      //         {notification.content.storyTitle}
      //       </Link>
      //     </>
      //   )
      case "donation":
        if (!notification.content) return notification.message || 'You received a donation';
        return (
          <>
            <Link href={`/user/${username}`} className="font-medium hover:text-primary">
              {username}
            </Link>
            {" donated "}
            {notification.content.amount && (
              <span className="font-medium">${(notification.content.amount / 100).toFixed(2)}</span>
            )}
            {notification.content.storyId ? (
              <>
                {" to your story "}
                <Link href={`/story/${notification.content.storySlug || notification.content.storyId}`} className="font-medium hover:text-primary">
                  {notification.content.storyTitle}
                </Link>
              </>
            ) : (
              " to support your work"
            )}
            {notification.content.message && (
              <div className="mt-1 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
                "{notification.content.message}"
              </div>
            )}
          </>
        )
      default:
        return notification.message || `New ${notification.type} notification`;
    }
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen">
        <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-semibold">Notifications</h1>

          <Button variant="outline" onClick={markAllAsReadAndDismiss} disabled={!filteredNotifications.some((n: any) => !n.read)}>
            <Check className="h-4 w-4 mr-2" />
            Mark all as read and dismiss
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            <p>Error: {error}</p>
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Loading notifications...</p>
                </div>
              </div>
            ) : filteredNotifications.length > 0 ? (
              <div>
                <AnimatePresence mode="popLayout">
                  {filteredNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 1, x: 0, height: "auto", marginBottom: "1rem" }}
                      animate={{
                        opacity: deletingNotifications.has(notification.id) ? 0 : 1,
                        x: deletingNotifications.has(notification.id) ? 300 : 0,
                        height: deletingNotifications.has(notification.id) ? 0 : "auto",
                        marginBottom: deletingNotifications.has(notification.id) ? 0 : "1rem"
                      }}
                      exit={{ opacity: 0, x: 300, height: 0, marginBottom: 0 }}
                      transition={{
                        duration: 0.3,
                        ease: "easeInOut"
                      }}
                      className="overflow-hidden"
                    >
                      <div className={`p-4 rounded-lg border ${!notification.read ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
                      <div className="flex gap-4">
                        {notification.actor && notification.actor.username && (
                          <Link href={`/user/${notification.actor.username}`}>
                            <Avatar className="h-10 w-10">
                              <AvatarImage
                                src={notification.actor.image}
                                alt={notification.actor.username}
                              />
                              <AvatarFallback>
                                {notification.actor.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </Link>
                        )}

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              {getNotificationIcon(notification.type)}
                              <div className="text-sm">{getNotificationContent(notification)}</div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(notification.createdAt)}
                              </span>

                              {!notification.read && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 hover:bg-green-100 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:text-green-400"
                                      onClick={() => handleDeleteNotification(notification.id)}
                                      disabled={deletingNotifications.has(notification.id)}
                                    >
                                      <Check className="h-4 w-4" />
                                      <span className="sr-only">Mark as read and dismiss</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Mark as read and dismiss</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={loadMoreNotifications}
                      disabled={isLoadingMore}
                    >
                      {isLoadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary mr-2"></div>
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
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  You don't have any notifications yet.
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
    </TooltipProvider>
  )
}
