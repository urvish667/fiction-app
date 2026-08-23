"use client"

import React from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Heart, MessageSquare, UserPlus, BookOpen, Bell, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { ImageService } from "@/lib/api/images"
import { formatRelativeTime } from "@/utils/date-utils"
import type { NotificationItemProps } from "../types/notification.types"

export function getNotificationIcon(type: string) {
  switch (type) {
    case "like":
    case "chapter_like":
    case "comment_like":
      return <Heart className="h-4 w-4 text-red-500" />
    case "comment":
    case "chapter_comment":
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

export function renderNotificationContent(notification: any) {
  const username = notification.actor?.username || "Someone"

  switch (notification.type) {
    case "like":
      if (!notification.content) return notification.message || "Someone liked your story"
      return (
        <>
          <Link href={`/user/${username}`} className="font-medium hover:text-primary">
            {username}
          </Link>
          {" liked your story "}
          <Link
            href={`/story/${notification.content.storySlug || notification.content.storyId}`}
            className="font-medium hover:text-primary"
          >
            {notification.content.storyTitle}
          </Link>
        </>
      )

    case "comment":
      if (!notification.content) return notification.message || "Someone commented on your story"
      return (
        <>
          <Link href={`/user/${username}`} className="font-medium hover:text-primary">
            {username}
          </Link>
          {" commented on your story "}
          <Link
            href={`/story/${notification.content.storySlug || notification.content.storyId}`}
            className="font-medium hover:text-primary"
          >
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
      if (!notification.content) return notification.message || "Someone liked your chapter"
      return (
        <>
          <Link href={`/user/${username}`} className="font-medium hover:text-primary">
            {username}
          </Link>
          {" liked your chapter "}
          <Link
            href={`/story/${notification.content.storySlug || notification.content.storyId}/chapter/${notification.content.chapterNumber}`}
            className="font-medium hover:text-primary"
          >
            {notification.content.chapterTitle}
          </Link>
        </>
      )

    case "chapter_comment":
      if (!notification.content) return notification.message || "Someone commented on your chapter"
      return (
        <>
          <Link href={`/user/${username}`} className="font-medium hover:text-primary">
            {username}
          </Link>
          {" commented on your chapter "}
          <Link
            href={`/story/${notification.content.storySlug || notification.content.storyId}/chapter/${notification.content.chapterNumber}`}
            className="font-medium hover:text-primary"
          >
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
      if (!notification.content) return notification.message || "Someone liked your comment"
      return (
        <>
          <Link href={`/user/${username}`} className="font-medium hover:text-primary">
            {username}
          </Link>
          {" liked your comment"}
          {notification.content.storyId && (
            <>
              {" on "}
              <Link
                href={`/story/${notification.content.storySlug || notification.content.storyId}`}
                className="font-medium hover:text-primary"
              >
                {notification.content.storyTitle}
              </Link>
            </>
          )}
        </>
      )

    case "reply":
    case "chapter_reply":
      if (!notification.content) return notification.message || "Someone replied to your comment"
      return (
        <>
          <Link href={`/user/${username}`} className="font-medium hover:text-primary">
            {username}
          </Link>
          {" replied to your comment"}
          {notification.content.storyId && (
            <>
              {" on "}
              <Link
                href={`/story/${notification.content.storySlug || notification.content.storyId}${notification.content.chapterId ? `/chapter/${notification.content.chapterNumber}` : ""}`}
                className="font-medium hover:text-primary"
              >
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

    case "donation":
      if (!notification.content) return notification.message || "You received a donation"
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
              <Link
                href={`/story/${notification.content.storySlug || notification.content.storyId}`}
                className="font-medium hover:text-primary"
              >
                {notification.content.storyTitle}
              </Link>
            </>
          ) : (
            " to support your work"
          )}
          {notification.content.message && (
            <div className="mt-1 text-sm text-muted-foreground bg-muted/30 p-2 rounded-md">
              &quot;{notification.content.message}&quot;
            </div>
          )}
        </>
      )

    default:
      return notification.message || `New ${notification.type} notification`
  }
}

export function NotificationItem({ notification, isDeleting, onDelete }: NotificationItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 1, x: 0, height: "auto", marginBottom: "1rem" }}
      animate={{
        opacity: isDeleting ? 0 : 1,
        x: isDeleting ? 300 : 0,
        height: isDeleting ? 0 : "auto",
        marginBottom: isDeleting ? 0 : "1rem",
      }}
      exit={{ opacity: 0, x: 300, height: 0, marginBottom: 0 }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      className="overflow-hidden"
    >
      <div className={`p-4 rounded-lg border ${!notification.read ? "bg-primary/5 border-primary/20" : "bg-card"}`}>
        <div className="flex gap-4">
          {notification.actor && notification.actor.username && (
            <Link href={`/user/${notification.actor.username}`}>
              <Avatar className="h-10 w-10">
                <AvatarImage
                  src={ImageService.getImageUrl(notification.actor.image) || "/placeholder-user.jpg"}
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
                <div className="text-sm">{renderNotificationContent(notification)}</div>
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
                        onClick={() => onDelete(notification.id)}
                        disabled={isDeleting}
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
  )
}

export default NotificationItem
