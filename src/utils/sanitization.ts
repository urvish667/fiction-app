/**
 * Sanitizes user input to prevent XSS attacks and malicious content
 */

// Basic HTML sanitization - remove script tags and other dangerous elements
export function sanitizeHtml(text: string): string {
  if (typeof window !== 'undefined' && window.DOMParser) {
    // Use DOMParser to sanitize HTML
    const parser = new DOMParser()
    const doc = parser.parseFromString(text, 'text/html')
    return doc.body?.textContent || text
  } else {
    // Fallback for server-side rendering
    return text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
  }
}

// Sanitize text input (title, usernames, etc.)
export function sanitizeText(text: string): string {
  return text
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 250) // Limit length
}

// Sanitize forum post content (HTML content from rich text editor)
export function sanitizeForumPost(content: string): string {
  return content
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/javascript:/gi, '') // Remove javascript: URLs
    .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
    .substring(0, 20000) // Allow longer content with HTML
}
