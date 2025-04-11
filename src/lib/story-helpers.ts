import { Chapter } from "@/types/story";

/**
 * Calculate the status of a story based on its chapters
 *
 * @param chapters Array of chapters for the story
 * @returns "draft" | "ongoing" | "completed"
 *
 * - draft: No published chapters (all chapters have status = 'draft' or 'scheduled', or there are no chapters)
 * - ongoing: At least one published chapter (status = 'published') but not marked as completed
 * - completed: At least one published chapter and manually marked as completed
 */
export function calculateStoryStatus(chapters: Chapter[] | undefined, isMarkedCompleted: boolean = false): "draft" | "ongoing" | "completed" {
  // If there are no chapters, the story is a draft
  if (!chapters || chapters.length === 0) {
    return "draft";
  }

  // Count published chapters (not draft or scheduled)
  const publishedChapters = chapters.filter(chapter =>
    chapter.status === 'published'
  );

  // If there are no published chapters, the story is a draft
  if (publishedChapters.length === 0) {
    return "draft";
  }

  // If the story is manually marked as completed and has at least one published chapter
  if (isMarkedCompleted && publishedChapters.length > 0) {
    return "completed";
  }

  // Otherwise, it's ongoing
  return "ongoing";
}

/**
 * Check if a story should be visible to non-authors
 *
 * @param storyStatus The calculated status of the story
 * @returns boolean - true if the story should be visible to non-authors
 *
 * Stories are visible to non-authors if they have at least one published chapter
 * (i.e., status is "ongoing" or "completed")
 */
export function isStoryPublic(storyStatus: "draft" | "ongoing" | "completed"): boolean {
  return storyStatus === "ongoing" || storyStatus === "completed";
}
