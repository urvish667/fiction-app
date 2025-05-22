/**
 * Comprehensive notification types and interfaces for the FableSpace application
 */

// Notification Types Enum
export enum NotificationType {
  // Story interactions
  LIKE = 'like',
  COMMENT = 'comment',

  // Chapter interactions
  CHAPTER_LIKE = 'chapter_like',
  CHAPTER_COMMENT = 'chapter_comment',

  // Comment interactions
  COMMENT_LIKE = 'comment_like',
  REPLY = 'reply',
  CHAPTER_REPLY = 'chapter_reply',

  // User interactions
  FOLLOW = 'follow',

  // Content updates
  CHAPTER = 'chapter',

  // Financial
  DONATION = 'donation',

  // System
  SYSTEM = 'system',
}

// Content interfaces for different notification types
export interface StoryNotificationContent {
  storyId: string;
  storyTitle: string;
  storySlug?: string;
}

export interface ChapterNotificationContent extends StoryNotificationContent {
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
}

export interface CommentNotificationContent extends StoryNotificationContent {
  commentId: string;
  comment: string;
  chapterId?: string;
  chapterTitle?: string;
}

export interface DonationNotificationContent extends Partial<StoryNotificationContent> {
  amount: number;
  message?: string;
  donationId: string;
}

export interface FollowNotificationContent {
  // No additional content needed for follow notifications
}

export interface SystemNotificationContent {
  action?: string;
  metadata?: Record<string, any>;
}

// Union type for all notification content
export type NotificationContent =
  | StoryNotificationContent
  | ChapterNotificationContent
  | CommentNotificationContent
  | DonationNotificationContent
  | FollowNotificationContent
  | SystemNotificationContent;

// Enhanced notification interface
export interface EnhancedNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  content?: NotificationContent;
  actorId?: string;
  read: boolean;
  createdAt: string;
  // Populated relations
  actor?: {
    id: string;
    username: string;
    image?: string;
  };
}

// Parameters for creating notifications
export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  content?: NotificationContent;
  actorId?: string;
}

// Notification response from API
export interface NotificationResponse {
  notifications: EnhancedNotification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

// Helper function to get notification display info
export function getNotificationDisplayInfo(type: NotificationType) {
  const displayMap = {
    [NotificationType.LIKE]: {
      icon: 'heart',
      color: 'text-red-500',
      category: 'engagement'
    },
    [NotificationType.COMMENT]: {
      icon: 'message-square',
      color: 'text-blue-500',
      category: 'engagement'
    },
    [NotificationType.CHAPTER_LIKE]: {
      icon: 'heart',
      color: 'text-red-500',
      category: 'engagement'
    },
    [NotificationType.CHAPTER_COMMENT]: {
      icon: 'message-square',
      color: 'text-blue-500',
      category: 'engagement'
    },
    [NotificationType.COMMENT_LIKE]: {
      icon: 'heart',
      color: 'text-red-500',
      category: 'engagement'
    },
    [NotificationType.REPLY]: {
      icon: 'reply',
      color: 'text-blue-500',
      category: 'engagement'
    },
    [NotificationType.CHAPTER_REPLY]: {
      icon: 'reply',
      color: 'text-blue-500',
      category: 'engagement'
    },
    [NotificationType.FOLLOW]: {
      icon: 'user-plus',
      color: 'text-green-500',
      category: 'social'
    },
    [NotificationType.CHAPTER]: {
      icon: 'book-open',
      color: 'text-purple-500',
      category: 'content'
    },
    [NotificationType.DONATION]: {
      icon: 'dollar-sign',
      color: 'text-amber-500',
      category: 'financial'
    },
    [NotificationType.SYSTEM]: {
      icon: 'bell',
      color: 'text-blue-400',
      category: 'system'
    },
  };

  return displayMap[type] || {
    icon: 'bell',
    color: 'text-gray-500',
    category: 'other'
  };
}

// Helper function to group notification types for filtering
export function getNotificationCategories() {
  return {
    all: Object.values(NotificationType),
    engagement: [
      NotificationType.LIKE,
      NotificationType.COMMENT,
      NotificationType.CHAPTER_LIKE,
      NotificationType.CHAPTER_COMMENT,
      NotificationType.COMMENT_LIKE,
      NotificationType.REPLY,
      NotificationType.CHAPTER_REPLY,
    ],
    social: [NotificationType.FOLLOW],
    content: [NotificationType.CHAPTER],
    financial: [NotificationType.DONATION],
    system: [NotificationType.SYSTEM],
  };
}
