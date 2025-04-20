/**
 * Utility functions for the editor
 */

import { format } from "date-fns"
import { PublishSettings } from "@/hooks/use-chapter-editor"

/**
 * Calculate word count from content
 * @param content The content to count words in
 * @returns The number of words
 */
export function calculateWordCount(content: string): number {
  if (!content || !content.trim()) {
    return 0
  }
  
  // Remove HTML tags
  const textOnly = content.replace(/<[^>]*>/g, ' ')
  
  // Split by whitespace and filter out empty strings
  const words = textOnly.trim().split(/\s+/).filter(Boolean)
  
  return words.length
}

/**
 * Format a date for display in the editor
 * @param date The date to format
 * @returns Formatted date string
 */
export function formatEditorDate(date: Date): string {
  return format(date, "MMM d, yyyy 'at' h:mm a")
}

/**
 * Validate publish settings
 * @param settings The publish settings to validate
 * @returns An error message if invalid, or null if valid
 */
export function validatePublishSettings(settings: PublishSettings): string | null {
  if (settings.schedulePublish) {
    const now = new Date()
    
    // Check if the publish date is in the future
    if (settings.publishDate <= now) {
      return "Publication date and time must be in the future"
    }
    
    // Check if the publish date is too far in the future (e.g., more than 1 year)
    const oneYearFromNow = new Date()
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1)
    
    if (settings.publishDate > oneYearFromNow) {
      return "Publication date cannot be more than 1 year in the future"
    }
  }
  
  return null
}

/**
 * Format a date for API submission
 * @param date The date to format
 * @returns ISO string formatted for API
 */
export function formatDateForApi(date: Date): string {
  return date.toISOString().split('.')[0] + 'Z'
}

/**
 * Check if there are unsaved changes
 * @param currentContent Current content
 * @param initialContent Initial content
 * @param currentTitle Current title
 * @param initialTitle Initial title
 * @returns Boolean indicating if there are unsaved changes
 */
export function hasUnsavedChanges(
  currentContent: string,
  initialContent: string,
  currentTitle: string,
  initialTitle: string
): boolean {
  return currentContent !== initialContent || currentTitle !== initialTitle
}

/**
 * Create a confirmation message for unsaved changes
 * @returns Confirmation message
 */
export function getUnsavedChangesMessage(): string {
  return 'You have unsaved changes. Are you sure you want to leave?'
}

/**
 * Generate a default chapter title based on chapter number
 * @param chapterNumber The chapter number
 * @returns Default chapter title
 */
export function generateDefaultChapterTitle(chapterNumber: number): string {
  return `Chapter ${chapterNumber}`
}
