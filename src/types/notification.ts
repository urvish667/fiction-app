export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  // Actor information (who triggered the notification)
  actor?: {
    id: string;
    username: string;
    image?: string;
  };
  content?: {
    storyId?: string;
    storyTitle?: string;
    storySlug?: string;
    chapterId?: string;
    chapterNumber?: number;
    chapterTitle?: string;
    commentId?: string;
    comment?: string;
    amount?: number;
    message?: string;
    donationId?: string;
  };
}

export interface NotificationResponse {
  notifications: Notification[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MarkReadRequest {
  ids?: string[];
  all?: boolean;
}

export interface MarkReadResponse {
  message: string;
}