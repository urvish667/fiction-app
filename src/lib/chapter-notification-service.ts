import { prisma } from '@/lib/prisma';
import { createNotification, queueNotification } from '@/lib/notification-service';
import { logger } from '@/lib/logger';
import { NotificationType } from '@/types/notification-types';

/**
 * Send notifications to followers when a new chapter is published
 * This is the synchronous version that waits for all notifications to be sent
 *
 * @param storyId The ID of the story
 * @param chapterId The ID of the chapter
 * @param authorId The ID of the author
 * @param notifyFollowers Whether to notify followers
 */
export async function notifyFollowersAboutNewChapter(
  storyId: string,
  chapterId: string,
  authorId: string,
  notifyFollowers: boolean = true
): Promise<void> {
  // If notifyFollowers is false, don't send notifications
  if (!notifyFollowers) {
    logger.info('Skipping follower notifications as notifyFollowers is false', {
      storyId,
      chapterId,
      authorId
    });
    return;
  }

  try {
    // Get the story details
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        title: true,
        slug: true,
        authorId: true,
        author: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });

    if (!story) {
      logger.error('Story not found when trying to notify followers', {
        storyId,
        chapterId,
        authorId
      });
      return;
    }

    // Get the chapter details
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        title: true,
        number: true,
      },
    });

    if (!chapter) {
      logger.error('Chapter not found when trying to notify followers', {
        storyId,
        chapterId,
        authorId
      });
      return;
    }

    // Get all followers of the author
    const followers = await prisma.follow.findMany({
      where: {
        followingId: authorId,
      },
      select: {
        followerId: true,
      },
    });

    logger.info(`Sending chapter notifications to ${followers.length} followers`, {
      storyId,
      chapterId,
      authorId,
      followerCount: followers.length
    });

    // Send notifications to all followers
    for (const follower of followers) {
      try {
        await createNotification({
          userId: follower.followerId,
          type: NotificationType.CHAPTER,
          title: 'New Chapter Published',
          message: `${story.author.username} published a new chapter in ${story.title}`,
          content: {
            storyId: story.id,
            storyTitle: story.title,
            storySlug: story.slug,
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            chapterTitle: chapter.title,
          },
          actorId: authorId,
        });
      } catch (error) {
        logger.error('Failed to send chapter notification to follower', {
          error,
          storyId,
          chapterId,
          authorId,
          followerId: follower.followerId
        });
      }
    }

    logger.info('Successfully sent chapter notifications to followers', {
      storyId,
      chapterId,
      authorId,
      followerCount: followers.length
    });
  } catch (error) {
    logger.error('Error sending chapter notifications to followers', {
      error,
      storyId,
      chapterId,
      authorId
    });
  }
}

/**
 * Queue notifications to followers when a new chapter is published
 * This is the asynchronous version that doesn't wait for notifications to be sent
 *
 * @param storyId The ID of the story
 * @param chapterId The ID of the chapter
 * @param authorId The ID of the author
 * @param notifyFollowers Whether to notify followers
 */
export async function queueFollowerNotificationsAboutNewChapter(
  storyId: string,
  chapterId: string,
  authorId: string,
  notifyFollowers: boolean = true
): Promise<void> {
  // If notifyFollowers is false, don't send notifications
  if (!notifyFollowers) {
    logger.info('Skipping follower notifications as notifyFollowers is false', {
      storyId,
      chapterId,
      authorId
    });
    return;
  }

  try {
    // Create a background task to handle notifications
    // This will return immediately while processing continues in the background

    // First, create a notification record to track this batch
    const notificationBatch = await prisma.notificationBatch.create({
      data: {
        type: 'chapter_publish',
        status: 'processing',
        metadata: {
          storyId,
          chapterId,
          authorId,
        },
      },
    });

    // Start the background processing without awaiting it
    processFollowerNotifications(storyId, chapterId, authorId, notificationBatch.id)
      .catch(error => {
        logger.error('Error in background notification processing', {
          error,
          storyId,
          chapterId,
          authorId,
          batchId: notificationBatch.id
        });
      });

    logger.info('Queued chapter notifications for background processing', {
      storyId,
      chapterId,
      authorId,
      batchId: notificationBatch.id
    });
  } catch (error) {
    logger.error('Error queueing chapter notifications', {
      error,
      storyId,
      chapterId,
      authorId
    });
  }
}

/**
 * Process follower notifications in the background
 * This function should not be called directly, but through queueFollowerNotificationsAboutNewChapter
 */
async function processFollowerNotifications(
  storyId: string,
  chapterId: string,
  authorId: string,
  batchId: string
): Promise<void> {
  try {
    // Get the story details
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: {
        id: true,
        title: true,
        slug: true,
        authorId: true,
        author: {
          select: {
            id: true,
            username: true,
            image: true,
          },
        },
      },
    });

    if (!story) {
      logger.error('Story not found when processing follower notifications', {
        storyId,
        chapterId,
        authorId,
        batchId
      });

      await updateBatchStatus(batchId, 'failed', { error: 'Story not found' });
      return;
    }

    // Get the chapter details
    const chapter = await prisma.chapter.findUnique({
      where: { id: chapterId },
      select: {
        id: true,
        title: true,
        number: true,
      },
    });

    if (!chapter) {
      logger.error('Chapter not found when processing follower notifications', {
        storyId,
        chapterId,
        authorId,
        batchId
      });

      await updateBatchStatus(batchId, 'failed', { error: 'Chapter not found' });
      return;
    }

    // Get all followers of the author
    const followers = await prisma.follow.findMany({
      where: {
        followingId: authorId,
      },
      select: {
        followerId: true,
      },
    });

    logger.info(`Processing chapter notifications for ${followers.length} followers`, {
      storyId,
      chapterId,
      authorId,
      batchId,
      followerCount: followers.length
    });

    // Update batch with follower count
    await updateBatchStatus(batchId, 'processing', {
      followerCount: followers.length,
      processed: 0
    });

    let successCount = 0;
    let failureCount = 0;

    // Send notifications to all followers
    for (let i = 0; i < followers.length; i++) {
      const follower = followers[i];

      try {
        // Use queueNotification instead of createNotification for better performance
        // This will handle the notification asynchronously
        await queueNotification({
          userId: follower.followerId,
          type: NotificationType.CHAPTER,
          title: 'New Chapter Published',
          message: `${story.author.username} published a new chapter in ${story.title}`,
          content: {
            storyId: story.id,
            storyTitle: story.title,
            storySlug: story.slug,
            chapterId: chapter.id,
            chapterNumber: chapter.number,
            chapterTitle: chapter.title,
          },
          actorId: authorId,
        });

        successCount++;
      } catch (error) {
        logger.error('Failed to queue chapter notification for follower', {
          error,
          storyId,
          chapterId,
          authorId,
          batchId,
          followerId: follower.followerId
        });

        failureCount++;
      }

      // Update batch progress every 10 followers or at the end
      if (i % 10 === 0 || i === followers.length - 1) {
        await updateBatchStatus(batchId, 'processing', {
          processed: i + 1,
          successCount,
          failureCount
        });
      }
    }

    // Mark batch as completed
    await updateBatchStatus(batchId, 'completed', {
      followerCount: followers.length,
      successCount,
      failureCount
    });

    logger.info('Successfully processed chapter notifications for followers', {
      storyId,
      chapterId,
      authorId,
      batchId,
      followerCount: followers.length,
      successCount,
      failureCount
    });
  } catch (error) {
    logger.error('Error processing follower notifications', {
      error,
      storyId,
      chapterId,
      authorId,
      batchId
    });

    await updateBatchStatus(batchId, 'failed', { error: error instanceof Error ? error.message : String(error) });
  }
}

/**
 * Update the status of a notification batch
 */
async function updateBatchStatus(
  batchId: string,
  status: 'processing' | 'completed' | 'failed',
  metadata: Record<string, any>
): Promise<void> {
  try {
    await prisma.notificationBatch.update({
      where: { id: batchId },
      data: {
        status,
        metadata: {
          ...metadata,
          updatedAt: new Date().toISOString()
        },
      },
    });
  } catch (error) {
    logger.error('Failed to update notification batch status', {
      error,
      batchId,
      status
    });
  }
}
