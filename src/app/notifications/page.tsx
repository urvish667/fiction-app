"use client"

import { useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bell, Heart, MessageSquare, UserPlus, BookOpen, MoreVertical, Check, Trash2 } from "lucide-react"
import Navbar from "@/components/navbar"

// Mock notification data
const mockNotifications = [
  {
    id: 1,
    type: "like",
    read: false,
    date: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    user: {
      name: "Emma Rivers",
      username: "emmarivers",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: 1,
      storyTitle: "The Last Lighthouse",
    },
  },
  {
    id: 2,
    type: "comment",
    read: false,
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    user: {
      name: "James Chen",
      username: "jameschen",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: 1,
      storyTitle: "The Last Lighthouse",
      comment: "This story is absolutely captivating! I couldn't stop reading once I started.",
    },
  },
  {
    id: 3,
    type: "follow",
    read: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    user: {
      name: "Sarah Blake",
      username: "sarahblake",
      avatar: "/placeholder-user.jpg",
    },
  },
  {
    id: 4,
    type: "chapter",
    read: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    user: {
      name: "Michael Torres",
      username: "michaeltorres",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: 2,
      storyTitle: "Echoes of Tomorrow",
      chapterNumber: 5,
      chapterTitle: "The Signal",
    },
  },
  {
    id: 5,
    type: "like",
    read: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
    user: {
      name: "Olivia Parker",
      username: "oliviaparker",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: 3,
      storyTitle: "Whispers in the Hallway",
    },
  },
  {
    id: 6,
    type: "comment",
    read: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4), // 4 days ago
    user: {
      name: "Daniel Wright",
      username: "danielwright",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: 3,
      storyTitle: "Whispers in the Hallway",
      comment: "The atmosphere you've created is so eerie and immersive. Can't wait for the next chapter!",
    },
  },
  {
    id: 7,
    type: "follow",
    read: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
    user: {
      name: "Elena Vasquez",
      username: "elenavasquez",
      avatar: "/placeholder-user.jpg",
    },
  },
  {
    id: 8,
    type: "chapter",
    read: true,
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6), // 6 days ago
    user: {
      name: "Ryan Kim",
      username: "ryankim",
      avatar: "/placeholder-user.jpg",
    },
    content: {
      storyId: 4,
      storyTitle: "Beyond the Horizon",
      chapterNumber: 3,
      chapterTitle: "Uncharted Waters",
    },
  },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(mockNotifications)
  const [activeTab, setActiveTab] = useState("all")

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    switch (activeTab) {
      case "unread":
        return notifications.filter((notification) => !notification.read)
      case "likes":
        return notifications.filter((notification) => notification.type === "like")
      case "comments":
        return notifications.filter((notification) => notification.type === "comment")
      case "follows":
        return notifications.filter((notification) => notification.type === "follow")
      case "chapters":
        return notifications.filter((notification) => notification.type === "chapter")
      default:
        return notifications
    }
  }

  const filteredNotifications = getFilteredNotifications()

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  // Mark all notifications as read
  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  // Delete notification
  const deleteNotification = (id: number) => {
    setNotifications(notifications.filter((notification) => notification.id !== id))
  }

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.floor(diffMs / 1000)
    const diffMins = Math.floor(diffSecs / 60)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSecs < 60) return "just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return date.toLocaleDateString()
  }

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
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Get notification content
  const getNotificationContent = (notification: (typeof mockNotifications)[0]) => {
    switch (notification.type) {
      case "like":
        if (!notification.content) return null
        return (
          <>
            <span className="font-medium">{notification.user.name}</span>
            {" liked your story "}
            <Link href={`/story/${notification.content.storyId}`} className="font-medium hover:text-primary">
              {notification.content.storyTitle}
            </Link>
          </>
        )
      case "comment":
        if (!notification.content) return null
        return (
          <>
            <p className="text-sm">
              <span className="font-medium">{notification.user.name}</span>
              {" commented on your story "}
              <Link href={`/story/${notification.content.storyId}`} className="font-medium hover:text-primary">
                {notification.content.storyTitle}
              </Link>
            </p>
            <div className="mt-1 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
              {notification.content.comment}
            </div>
          </>
        )
      case "follow":
        return (
          <>
            <span className="font-medium">{notification.user.name}</span>
            {" started following you"}
          </>
        )
      case "chapter":
        if (!notification.content) return null
        return (
          <>
            <span className="font-medium">{notification.user.name}</span>
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
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <main className="container mx-auto px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold">Notifications</h1>

          <Button variant="outline" onClick={markAllAsRead} disabled={!notifications.some((n) => !n.read)}>
            <Check className="h-4 w-4 mr-2" />
            Mark all as read
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="mb-8">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {notifications.filter((n) => !n.read).length > 0 && (
                <span className="ml-1 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                  {notifications.filter((n) => !n.read).length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="likes">Likes</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="follows">Follows</TabsTrigger>
            <TabsTrigger value="chapters">New Chapters</TabsTrigger>
          </TabsList>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            {filteredNotifications.length > 0 ? (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${!notification.read ? "bg-primary/5 border-primary/20" : "bg-card"}`}
                  >
                    <div className="flex gap-4">
                      <Link href={`/user/${notification.user.username}`}>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={notification.user.avatar} alt={notification.user.name} />
                          <AvatarFallback>{notification.user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                      </Link>

                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {getNotificationIcon(notification.type)}
                            <p className="text-sm">{getNotificationContent(notification)}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">{formatDate(notification.date)}</span>

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

                        {notification.type === "follow" && (
                          <div className="mt-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/user/${notification.user.username}`}>View Profile</Link>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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

