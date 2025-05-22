/**
 * Helper functions for creating standardized notifications
 */

import { createNotification } from './notification-service';
import {
  NotificationType,
  StoryNotificationContent,
  ChapterNotificationContent,
  CommentNotificationContent,
  DonationNotificationContent,
  FollowNotificationContent
} from '@/types/notification-types';

// Story like notification
export async function createStoryLikeNotification(params: {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  storyId: string;
  storyTitle: string;
  storySlug?: string;
}) {
  const { recipientId, actorId, actorUsername, storyId, storyTitle, storySlug } = params;

  return createNotification({
    userId: recipientId,
    type: NotificationType.LIKE,
    title: 'New Like',
    message: `${actorUsername} liked your story "${storyTitle}"`,
    content: {
      storyId,
      storyTitle,
      storySlug,
    } as StoryNotificationContent,
    actorId,
  });
}

// Chapter like notification
export async function createChapterLikeNotification(params: {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  storyId: string;
  storyTitle: string;
  storySlug?: string;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
}) {
  const { recipientId, actorId, actorUsername, storyId, storyTitle, storySlug, chapterId, chapterNumber, chapterTitle } = params;

  return createNotification({
    userId: recipientId,
    type: NotificationType.CHAPTER_LIKE,
    title: 'New Chapter Like',
    message: `${actorUsername} liked your chapter "${chapterTitle}"`,
    content: {
      storyId,
      storyTitle,
      storySlug,
      chapterId,
      chapterNumber,
      chapterTitle,
    } as ChapterNotificationContent,
    actorId,
  });
}

// Story comment notification
export async function createStoryCommentNotification(params: {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  storyId: string;
  storyTitle: string;
  storySlug?: string;
  commentId: string;
  comment: string;
}) {
  const { recipientId, actorId, actorUsername, storyId, storyTitle, storySlug, commentId, comment } = params;

  return createNotification({
    userId: recipientId,
    type: NotificationType.COMMENT,
    title: 'New Comment',
    message: `${actorUsername} commented on your story "${storyTitle}"`,
    content: {
      storyId,
      storyTitle,
      storySlug,
      commentId,
      comment,
    } as CommentNotificationContent,
    actorId,
  });
}

// Chapter comment notification
export async function createChapterCommentNotification(params: {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  storyId: string;
  storyTitle: string;
  storySlug?: string;
  chapterId: string;
  chapterTitle: string;
  commentId: string;
  comment: string;
}) {
  const { recipientId, actorId, actorUsername, storyId, storyTitle, storySlug, chapterId, chapterTitle, commentId, comment } = params;

  return createNotification({
    userId: recipientId,
    type: NotificationType.CHAPTER_COMMENT,
    title: 'New Chapter Comment',
    message: `${actorUsername} commented on chapter "${chapterTitle}" of your story "${storyTitle}"`,
    content: {
      storyId,
      storyTitle,
      storySlug,
      commentId,
      comment,
      chapterId,
      chapterTitle,
    } as CommentNotificationContent,
    actorId,
  });
}

// Comment like notification
export async function createCommentLikeNotification(params: {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  commentId: string;
  comment: string;
  storyId?: string;
  storyTitle?: string;
  storySlug?: string;
}) {
  const { recipientId, actorId, actorUsername, commentId, comment, storyId, storyTitle, storySlug } = params;

  return createNotification({
    userId: recipientId,
    type: NotificationType.COMMENT_LIKE,
    title: 'New Like',
    message: `${actorUsername} liked your comment`,
    content: {
      commentId,
      comment,
      storyId,
      storyTitle,
      storySlug,
    } as CommentNotificationContent,
    actorId,
  });
}

// Reply notification
export async function createReplyNotification(params: {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  commentId: string;
  comment: string;
  storyId?: string;
  storyTitle?: string;
  storySlug?: string;
  chapterId?: string;
  chapterTitle?: string;
}) {
  const { recipientId, actorId, actorUsername, commentId, comment, storyId, storyTitle, storySlug, chapterId, chapterTitle } = params;

  const isChapterReply = !!chapterId;

  return createNotification({
    userId: recipientId,
    type: isChapterReply ? NotificationType.CHAPTER_REPLY : NotificationType.REPLY,
    title: 'New Reply',
    message: isChapterReply
      ? `${actorUsername} replied to your comment on chapter "${chapterTitle}"`
      : `${actorUsername} replied to your comment`,
    content: {
      commentId,
      comment,
      storyId,
      storyTitle,
      storySlug,
      chapterId,
      chapterTitle,
    } as CommentNotificationContent,
    actorId,
  });
}

// Follow notification
export async function createFollowNotification(params: {
  recipientId: string;
  actorId: string;
  actorUsername: string;
}) {
  const { recipientId, actorId, actorUsername } = params;

  return createNotification({
    userId: recipientId,
    type: NotificationType.FOLLOW,
    title: 'New Follower',
    message: `${actorUsername} started following you`,
    content: {} as FollowNotificationContent,
    actorId,
  });
}

// Donation notification
export async function createDonationNotification(params: {
  recipientId: string;
  actorId: string;
  actorUsername: string;
  donationId: string;
  amount: number;
  message?: string;
  storyId?: string;
  storyTitle?: string;
  storySlug?: string;
}) {
  const { recipientId, actorId, actorUsername, donationId, amount, message, storyId, storyTitle, storySlug } = params;

  const formattedAmount = (amount / 100).toFixed(2);
  const notificationMessage = storyId
    ? `${actorUsername} donated $${formattedAmount} to your story "${storyTitle}"`
    : `${actorUsername} donated $${formattedAmount} to support your work`;

  return createNotification({
    userId: recipientId,
    type: NotificationType.DONATION,
    title: 'New Donation Received!',
    message: notificationMessage,
    content: {
      donationId,
      amount,
      message,
      storyId,
      storyTitle,
      storySlug,
    } as DonationNotificationContent,
    actorId,
  });
}
