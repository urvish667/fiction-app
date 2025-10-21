import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a string to a URL-friendly slug, handling special characters and CJK characters.
 * @param text The text to convert to a slug.
 * @returns A URL-friendly slug.
 */
export function slugify(text: string): string {
  const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
  const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
  const p = new RegExp(a.split('').join('|'), 'g')

  return text.toString().toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
    .replace(/&/g, '-and-') // Replace & with 'and'
    .replace(/[^\w\-]+/g, '') // Remove all non-word characters
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, '') // Trim - from end of text
}

/**
 * Get the base URL for internal API calls
 * Works in both client and server contexts
 * @returns The base URL for API calls
 */
export function getBaseUrl(): string {
  // In browser, use relative URLs
  if (typeof window !== 'undefined') {
    return '';
  }

  // In server context, use the configured base URL
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // Fallback to NEXTAUTH_URL if available
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL;
  }

  // Default fallback for development
  return 'http://localhost:3000';
}

/**
 * Calculates the word count of a string
 * @param text The text to count words in (may contain HTML)
 * @returns The number of words in the text
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) {
    return 0
  }
  
  // Remove HTML tags first
  const textOnly = text.replace(/<[^>]*>/g, ' ')
  
  // Split by whitespace and filter out empty strings
  const words = textOnly.trim().split(/\s+/).filter(Boolean)
  
  return words.length
}
