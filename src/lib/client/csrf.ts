/**
 * Client-side CSRF utility
 *
 * This module provides client-side functions for working with CSRF tokens.
 */

// Constants
export const CSRF_COOKIE_NAME = 'fablespace_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

// Store the token in memory for faster access
let csrfTokenCache: string | null = null;

/**
 * Get the CSRF token from cookies or memory cache
 * @returns The CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  // Return from cache if available
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  // Parse cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies[CSRF_COOKIE_NAME] || null;

  // Cache the token if found
  if (token) {
    csrfTokenCache = token;
  }

  return token;
}

/**
 * Set the CSRF token in memory and cookie
 * @param token The CSRF token to set
 */
export function setCsrfToken(token: string): void {
  // Set in memory cache
  csrfTokenCache = token;

  // Set in cookie
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; path=/; samesite=lax; ${window.location.protocol === 'https:' ? 'secure;' : ''}`;
}

/**
 * Ensure a CSRF token is available, fetching one if needed
 * @returns A promise that resolves when a token is available
 */
export async function ensureCsrfToken(): Promise<string> {
  // Check if we already have a token
  const existingToken = getCsrfToken();
  if (existingToken) {
    return existingToken;
  }

  // Fetch a new token
  try {
    const response = await fetch('/api/csrf/setup', {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success || !data.token) {
      throw new Error('Invalid response from CSRF setup endpoint');
    }

    // Set the token
    setCsrfToken(data.token);

    return data.token;
  } catch (error) {
    console.error('Error ensuring CSRF token:', error);
    throw error;
  }
}

/**
 * Add CSRF token to fetch options for non-GET requests
 * @param options Fetch options
 * @returns Updated fetch options with CSRF token
 */
export function addCsrfToken(options: RequestInit = {}): RequestInit {
  // Skip for GET, HEAD, OPTIONS requests (they should be idempotent)
  const method = options.method || 'GET';
  if (['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    return options;
  }

  // Get the CSRF token
  const csrfToken = getCsrfToken();
  if (!csrfToken) {
    console.warn('CSRF token not found in cookies');
    return options;
  }

  // Add the CSRF token to headers
  const headers = new Headers(options.headers || {});
  headers.set(CSRF_HEADER_NAME, csrfToken);

  return {
    ...options,
    headers,
    credentials: 'include', // Always include credentials for CSRF requests
  };
}

/**
 * Fetch wrapper that adds CSRF token to requests
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns Fetch response
 */
export async function fetchWithCsrf(url: string, options: RequestInit = {}): Promise<Response> {
  // Ensure we have a CSRF token
  await ensureCsrfToken();

  // Add the token to the request
  const optionsWithCsrf = addCsrfToken(options);

  // Make the request
  return fetch(url, optionsWithCsrf);
}
