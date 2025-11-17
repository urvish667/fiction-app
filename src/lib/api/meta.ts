import { apiClient } from "@/lib/apiClient";
import { logError } from "@/lib/error-logger";
import type { ApiResponse } from "./story";

// Types for metadata
export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  _count?: {
    stories: number;
  };
}

export interface Language {
  id: string;
  name: string;
  code?: string;
}

// Cache configuration
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class MetadataCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private readonly localStoragePrefix = 'fable_meta_cache_';
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Load cache from localStorage on initialization
    this.loadFromLocalStorage();
  }

  private loadFromLocalStorage() {
    if (typeof window === 'undefined') return;

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(this.localStoragePrefix)) {
          const cacheKey = key.replace(this.localStoragePrefix, '');
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry: CacheEntry<any> = JSON.parse(stored);
            // Check if entry is still valid
            if (Date.now() - entry.timestamp < entry.ttl) {
              this.cache.set(cacheKey, entry);
            } else {
              // Remove expired entry
              localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (error) {
      // Ignore localStorage errors
      console.warn('Failed to load metadata cache from localStorage:', error);
    }
  }

  private saveToLocalStorage(key: string, entry: CacheEntry<any>) {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(
        this.localStoragePrefix + key,
        JSON.stringify(entry)
      );
    } catch (error) {
      // Ignore localStorage errors (quota exceeded, etc.)
      console.warn('Failed to save metadata cache to localStorage:', error);
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      // Remove from localStorage too
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.localStoragePrefix + key);
      }
      return null;
    }

    return entry.data;
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL) {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl
    };

    this.cache.set(key, entry);
    this.saveToLocalStorage(key, entry);
  }

  clear() {
    this.cache.clear();
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith(this.localStoragePrefix)) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
      } catch (error) {
        console.warn('Failed to clear metadata cache from localStorage:', error);
      }
    }
  }

  // Get cache stats for debugging
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const metadataCache = new MetadataCache();

/**
 * Metadata API service for genres, tags, and languages
 */
export const MetaService = {
  /**
   * Get all genres
   */
  async getGenres(): Promise<ApiResponse<Genre[]>> {
    const cacheKey = 'genres';

    // Check cache first
    const cached = metadataCache.get<Genre[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached
      };
    }

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Genre[];
      }>('/genres');

      // Cache the result
      metadataCache.set(cacheKey, response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch genres", {
        context: 'Fetching genres',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch genres"
      };
    }
  },

  /**
   * Get all tags
   */
  async getTags(): Promise<ApiResponse<Tag[]>> {
    const cacheKey = 'tags';

    // Check cache first
    const cached = metadataCache.get<Tag[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached
      };
    }

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Tag[];
      }>('/tags');

      // Cache the result
      metadataCache.set(cacheKey, response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch tags", {
        context: 'Fetching tags',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch tags"
      };
    }
  },

  /**
   * Get all languages
   */
  async getLanguages(): Promise<ApiResponse<Language[]>> {
    const cacheKey = 'languages';

    // Check cache first
    const cached = metadataCache.get<Language[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached
      };
    }

    try {
      const response = await apiClient.get<{
        success: boolean;
        data: Language[];
      }>('/languages');

      // Cache the result
      metadataCache.set(cacheKey, response.data);

      return {
        success: true,
        data: response.data
      };
    } catch (error: any) {
      logError(error.message || "Failed to fetch languages", {
        context: 'Fetching languages',
        status: error.status,
        errorDetails: error
      });
      return {
        success: false,
        message: error.message || "Failed to fetch languages"
      };
    }
  },

  /**
   * Clear all cached metadata
   */
  clearCache() {
    metadataCache.clear();
  },

  /**
   * Get cache statistics (for debugging)
   */
  getCacheStats() {
    return metadataCache.getStats();
  }
};
