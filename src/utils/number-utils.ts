/**
 * Formats large numbers into human-readable format
 * Examples:
 * - 1000 → "1k"
 * - 1500 → "1.5k"
 * - 1000000 → "1M"
 * - 1200000 → "1.2M"
 * - 1000000000 → "1B"
 */
export function formatNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  return num.toString();
}

/**
 * Formats numbers for stats display (views, likes, comments)
 * Alias for formatNumber for semantic clarity
 */
export const formatStatNumber = formatNumber;
