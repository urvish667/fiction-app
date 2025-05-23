/**
 * Format a date to a relative time string (e.g., "2h ago", "3d ago")
 */
export function formatRelativeTime(dateString: string | Date | undefined | null): string {
  // Handle null, undefined, or empty string
  if (!dateString) {
    return "Unknown time";
  }

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return "Unknown time";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  } catch (error) {
    return "Unknown time";
  }
}

/**
 * Check if a date is within the last 48 hours
 * @param dateString The date to check
 * @returns True if the date is within the last 48 hours
 */
export function isWithin48Hours(dateString: string | Date | undefined | null): boolean {
  // Handle null, undefined, or empty string
  if (!dateString) {
    return false;
  }

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    return diffHours <= 48;
  } catch (error) {
    return false;
  }
}
