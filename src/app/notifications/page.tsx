"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Heart, MessageSquare, UserPlus, BookOpen, MoreVertical, Check, Trash2 } from "lucide-react"
import Navbar from "@/components/navbar"
import { useNotifications } from "@/hooks/useNotifications"
import { formatRelativeTime } from "@/utils/date-utils"
import { Notification } from "@/types/notification"

// Notification item component
interface NotificationItemProps {
  notification: Notification
  getNotificationIcon: (type: string) => React.ReactNode
  getNotificationContent: (notification: any) => React.ReactNode
  markAsRead: (id: string) => void
  deleteNotification: (id: string) => void
}

const NotificationItem = ({
  notification,
  getNotificationIcon,
  getNotificationContent,
  markAsRead,
  deleteNotification,
}: NotificationItemProps) => {
  return (
    <div
      key={notification.id}
      className={`p-4 rounded-lg border ${!notification.read ? "bg-primary/5 border-primary/20" : "bg-card"}`}
    >
      <div className="flex gap-4">
        {notification.user && (
          <Link href={`/user/${notification.user.username}`}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
              <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </Link>
        )}

        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {getNotificationIcon(notification.type)}
              <p className="text-sm">
                {getNotificationContent(notification) || notification.message || `New ${notification.type} notification`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(notification.createdAt || (notification.date as Date))}
              </span>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!notification.read && (
                    <DropdownMenuItem onClick={() => markAsRead(notification.id)}>
                      <Check className="h-4 w-4 mr-2" />
                      Mark as read
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => deleteNotification(notification.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {notification.type === "follow" && notification.user && (
            <div className="mt-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/user/${notification.user.username}`}>View Profile</Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


export default function NotificationsPage() {
  const {
    filteredNotifications,
    groupedNotifications,
    hasNotifications,
    activeTab,
    setActiveTab,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    loading,
    error,
  } = useNotifications({ useMockData: false })

  // Get notification icon
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="h-4 w-4 text-red-500" />
      case "comment":
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
    // If user is missing, use a fallback
    const userName = notification.user?.name || 'Someone';

    switch (notification.type) {
      case "like":
        if (!notification.content) return notification.message || 'Someone liked your story';
        return (
          <>
            <span className="font-medium">{userName}</span>
            {" liked your story "}
            <Link href={`/story/${notification.content.storyId}`} className="font-medium hover:text-primary">
              {notification.content.storyTitle}
            </Link>
          </>
        )
      case "comment":
        if (!notification.content) return notification.message || 'Someone commented on your story';
        return (
          <>
            <p className="text-sm">
              <span className="font-medium">{userName}</span>
              {" commented on your story "}
              <Link href={`/story/${notification.content.storyId}`} className="font-medium hover:text-primary">
                {notification.content.storyTitle}
              </Link>
            </p>
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
            <span className="font-medium">{userName}</span>
            {" started following you"}
          </>
        )
      case "chapter":
        if (!notification.content) return notification.message || 'New chapter published';
        return (
          <>
            <span className="font-medium">{userName}</span>
            {" published a new chapter: "}
            <Link
              href={`/story/${notification.content.storyId}/chapter/${notification.content.chapterNumber}`}
              className="font-medium hover:text-primary"
            >
              Chapter {notification.content.chapterNumber}: {notification.content.chapterTitle}
            </Link>
            {" in "}
            <Link href={`/story/${notification.content.storyId}`} className="font-medium hover:text-primary">
              {notification.content.storyTitle}
            </Link>
          </>
        )
      case "donation":
        return notification.message || 'You received a donation';
      default:
        return notification.message || `New ${notification.type} notification`;
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Notifications</h1>

          <Button variant="outline" onClick={markAllAsRead} disabled={!filteredNotifications.some((n: any) => !n.read)}>
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            <p>Error: {error}</p>
          </div>
        )}

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {filteredNotifications.filter((n: any) => !n.read).length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {filteredNotifications.filter((n: any) => !n.read).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="like">Likes</TabsTrigger>
            <TabsTrigger value="comment">Comments</TabsTrigger>
            <TabsTrigger value="follow">Follows</TabsTrigger>
            <TabsTrigger value="chapter">New Chapters</TabsTrigger>
            <TabsTrigger value="donation">Donations</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
          </TabsList>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="flex flex-col items-center gap-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-sm text-muted-foreground">Loading notifications...</p>
                </div>
              </div>
            ) : hasNotifications ? (
              <div className="space-y-8">
                {/* Today's notifications */}
                {groupedNotifications.today.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Today</h3>
                    {groupedNotifications.today.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationContent={getNotificationContent}
                        markAsRead={markAsRead}
                        deleteNotification={deleteNotification}
                      />
                    ))}
                  </div>
                )}

                {/* Yesterday's notifications */}
                {groupedNotifications.yesterday.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Yesterday</h3>
                    {groupedNotifications.yesterday.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationContent={getNotificationContent}
                        markAsRead={markAsRead}
                        deleteNotification={deleteNotification}
                      />
                    ))}
                  </div>
                )}

                {/* This week's notifications */}
                {groupedNotifications.thisWeek.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">This Week</h3>
                    {groupedNotifications.thisWeek.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationContent={getNotificationContent}
                        markAsRead={markAsRead}
                        deleteNotification={deleteNotification}
                      />
                    ))}
                  </div>
                )}

                {/* This month's notifications */}
                {groupedNotifications.thisMonth.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">This Month</h3>
                    {groupedNotifications.thisMonth.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationContent={getNotificationContent}
                        markAsRead={markAsRead}
                        deleteNotification={deleteNotification}
                      />
                    ))}
                  </div>
                )}

                {/* Older notifications */}
                {groupedNotifications.older.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Older</h3>
                    {groupedNotifications.older.map((notification) => (
                      <NotificationItem
                        key={notification.id}
                        notification={notification}
                        getNotificationIcon={getNotificationIcon}
                        getNotificationContent={getNotificationContent}
                        markAsRead={markAsRead}
                        deleteNotification={deleteNotification}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No notifications</h3>
                <p className="text-muted-foreground">
                  {activeTab === "all"
                    ? "You don't have any notifications yet."
                    : `You don't have any ${activeTab} notifications.`}
                </p>
              </div>
            )}
          </motion.div>
        </Tabs>


      </main>
    </div>
  )
}

