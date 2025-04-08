import { Chapter } from "@/types/story";

/**
 * Calculate the status of a story based on its chapters
 * 
 * @param chapters Array of chapters for the story
 * @returns "draft" | "ongoing" | "completed"
 * 
 * - draft: No published chapters (all chapters have isDraft = true, or there are no chapters)
 * - ongoing: At least one published chapter (isDraft = false) but still contains draft chapters
 * - completed: At least one chapter, and all chapters are published (isDraft = false)
 */
export function calculateStoryStatus(chapters: Chapter[] | undefined): "draft" | "ongoing" | "completed" {
  // If there are no chapters, the story is a draft
  if (!chapters || chapters.length === 0) {
    return "draft";
  }

  // Count published and draft chapters
  const publishedChapters = chapters.filter(chapter => !chapter.isDraft);
  const draftChapters = chapters.filter(chapter => chapter.isDraft);

  // If there are no published chapters, the story is a draft
  if (publishedChapters.length === 0) {
    return "draft";
  }

  // If there are published chapters but also draft chapters, the story is ongoing
  if (draftChapters.length > 0) {
    return "ongoing";
  }

  // If all chapters are published, the story is completed
  return "completed";
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
