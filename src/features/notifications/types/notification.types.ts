import type { Notification } from "@/types/notification"

export type NotificationType =
  | "like"
  | "chapter_like"
  | "comment_like"
  | "comment"
  | "chapter_comment"
  | "reply"
  | "chapter_reply"
  | "follow"
  | "chapter"
  | "donation"
  | "system"

export interface NotificationItemProps {
  notification: Notification
  isDeleting: boolean
  onDelete: (id: string) => void
}

export interface NotificationHeaderProps {
  onMarkAllAsRead: () => void
  hasUnread: boolean
}
