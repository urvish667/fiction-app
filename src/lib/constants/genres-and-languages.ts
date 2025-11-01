import { slugify } from '@/lib/utils';

/**
 * Genre item with name and pre-computed slug for filtering
 */
export interface GenreItem {
  name: string;
  slug: string;
}

/**
 * Language item with name and pre-computed slug for filtering
 */
export interface LanguageItem {
  name: string;
  slug: string;
}

/**
 * Complete list of genres available in the platform
 * Pre-computed with slugs for efficient filtering without database queries
 */
export const GENRES: GenreItem[] = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Historical',
  'Adventure',
  'Young Adult',
  'Drama',
  'Comedy',
  'Non-Fiction',
  'Memoir',
  'Biography',
  'Self-Help',
  'Children',
  'Crime',
  'Poetry',
  'LGBTQ+',
  'Short Story',
  'Urban',
  'Paranormal',
  'Dystopian',
  'Slice of Life',
  'Fanfiction'
].map(name => ({
  name,
  slug: slugify(name)
}));

/**
 * Complete list of languages available in the platform
 * Pre-computed with slugs for efficient filtering without database queries
 */
export const LANGUAGES: LanguageItem[] = [
  'English',
  'Spanish',
  'French',
  'German',
  'Italian',
  'Portuguese',
  'Russian',
  'Chinese',
  'Japanese',
  'Korean',
  'Hindi',
  'Arabic',
  'Turkish',
  'Vietnamese',
  'Indonesian',
  'Bengali',
  'Polish',
  'Dutch',
  'Swedish',
  'Greek',
  'Czech',
  'Thai',
  'Hebrew',
  'Romanian',
  'Hungarian',
  'Ukrainian'
].map(name => ({
  name,
  slug: slugify(name)
}));

/**
 * Get genre by slug
 * @param slug The slug to search for
 * @returns GenreItem or undefined if not found
 */
export function getGenreBySlug(slug: string): GenreItem | undefined {
  return GENRES.find(genre => genre.slug === slug);
}

/**
 * Get language by slug
 * @param slug The slug to search for
 * @returns LanguageItem or undefined if not found
 */
export function getLanguageBySlug(slug: string): LanguageItem | undefined {
  return LANGUAGES.find(language => language.slug === slug);
}

/**
 * Get genre by name (case-insensitive)
 * @param name The name to search for
 * @returns GenreItem or undefined if not found
 */
export function getGenreByName(name: string): GenreItem | undefined {
  return GENRES.find(genre => 
    genre.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get language by name (case-insensitive)
 * @param name The name to search for
 * @returns LanguageItem or undefined if not found
 */
export function getLanguageByName(name: string): LanguageItem | undefined {
  return LANGUAGES.find(language => 
    language.name.toLowerCase() === name.toLowerCase()
  );
}

/**
 * Get all genre names as an array
 */
export const GENRE_NAMES: string[] = GENRES.map(genre => genre.name);

/**
 * Get all language names as an array
 */
export const LANGUAGE_NAMES: string[] = LANGUAGES.map(language => language.name);

/**
 * Get all genre slugs as an array
 */
export const GENRE_SLUGS: string[] = GENRES.map(genre => genre.slug);

/**
 * Get all language slugs as an array
 */
export const LANGUAGE_SLUGS: string[] = LANGUAGES.map(language => language.slug);
