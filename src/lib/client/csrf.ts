/**
 * Client-side CSRF utility
 *
 * This module provides client-side functions for working with CSRF tokens.
 */

import { logError, logWarning } from "../error-logger";

// Constants
export const CSRF_COOKIE_NAME = 'fablespace_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours
const TOKEN_REFRESH_THRESHOLD = 2 * 60 * 60 * 1000; // Refresh if less than 2 hours remaining

// Store the token in memory for faster access
let csrfTokenCache: string | null = null;
let tokenExpiryTime: number | null = null;

/**
 * Validate if a CSRF token is expired
 * @param token The CSRF token to validate
 * @returns true if token is valid and not expired
 */
function isTokenValid(token: string): boolean {
  try {
    const [, timestampStr] = token.split(':');
    if (!timestampStr) return false;
    
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;
    
    // Check if token has expired
    return Date.now() < timestamp;
  } catch (error) {
    return false;
  }
}

/**
 * Check if token needs refresh (less than 2 hours remaining)
 * @param token The CSRF token to check
 * @returns true if token should be refreshed
 */
function shouldRefreshToken(token: string): boolean {
  try {
    const [, timestampStr] = token.split(':');
    if (!timestampStr) return true;
    
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return true;
    
    // Refresh if less than 2 hours remaining
    return (timestamp - Date.now()) < TOKEN_REFRESH_THRESHOLD;
  } catch (error) {
    return true;
  }
}

/**
 * Get the CSRF token from cookies or memory cache
 * @returns The CSRF token or null if not found
 */
export function getCsrfToken(): string | null {
  // Check if cached token is still valid
  if (csrfTokenCache && tokenExpiryTime) {
    if (Date.now() < tokenExpiryTime) {
      return csrfTokenCache;
    } else {
      // Clear expired cache
      csrfTokenCache = null;
      tokenExpiryTime = null;
    }
  }

  // Parse cookies
  const cookies = document.cookie.split(';').reduce((acc, cookie) => {
    const [key, value] = cookie.trim().split('=');
    acc[key] = value;
    return acc;
  }, {} as Record<string, string>);

  const token = cookies[CSRF_COOKIE_NAME] || null;

  // Validate token before caching
  if (token && isTokenValid(token)) {
    csrfTokenCache = token;
    // Extract expiry time from token
    try {
      const [, timestampStr] = token.split(':');
      tokenExpiryTime = parseInt(timestampStr, 10);
    } catch (error) {
      tokenExpiryTime = Date.now() + CSRF_TOKEN_TTL;
    }
    return token;
  }

  // Token is invalid or expired
  if (token) {
    logWarning('CSRF token found but expired or invalid', { context: 'Getting CSRF token' });
  }
  
  return null;
}

/**
 * Set the CSRF token in memory and cookie
 * @param token The CSRF token to set
 */
export function setCsrfToken(token: string): void {
  // Validate token before setting
  if (!isTokenValid(token)) {
    logWarning('Attempting to set invalid or expired CSRF token', { context: 'Setting CSRF token' });
    return;
  }

  // Set in memory cache
  csrfTokenCache = token;
  
  // Extract and cache expiry time
  try {
    const [, timestampStr] = token.split(':');
    tokenExpiryTime = parseInt(timestampStr, 10);
  } catch (error) {
    tokenExpiryTime = Date.now() + CSRF_TOKEN_TTL;
  }

  // Set in cookie with proper expiry
  const maxAge = tokenExpiryTime ? Math.floor((tokenExpiryTime - Date.now()) / 1000) : 86400; // 24 hours default
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; path=/; samesite=lax; max-age=${maxAge}; ${window.location.protocol === 'https:' ? 'secure;' : ''}`;
}

/**
 * Ensure a CSRF token is available, fetching one if needed
 * @param forceRefresh Force fetching a new token even if one exists
 * @returns A promise that resolves when a token is available
 */
export async function ensureCsrfToken(forceRefresh: boolean = false): Promise<string> {
  // Check if we already have a valid token
  const existingToken = getCsrfToken();
  
  if (existingToken && !forceRefresh) {
    // Check if token needs refresh
    if (shouldRefreshToken(existingToken)) {
      // Refresh in background, but return existing token for now
      refreshCsrfTokenInBackground();
    }
    return existingToken;
  }

  // Fetch a new token
  return await fetchNewCsrfToken();
}

/**
 * Fetch a new CSRF token from the server
 * @returns A promise that resolves with the new token
 */
async function fetchNewCsrfToken(): Promise<string> {
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
    logError(error, { context: 'Fetching CSRF token' });
    throw error;
  }
}

/**
 * Refresh CSRF token in the background
 */
let refreshPromise: Promise<string> | null = null;
async function refreshCsrfTokenInBackground(): Promise<void> {
  // Prevent multiple simultaneous refresh requests
  if (refreshPromise) {
    return;
  }

  try {
    refreshPromise = fetchNewCsrfToken();
    await refreshPromise;
  } catch (error) {
    logError(error, { context: 'Refreshing CSRF token in background' });
  } finally {
    refreshPromise = null;
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
    logWarning('CSRF token not found in cookies', { context: 'Adding CSRF token' });
    return options;
  }

  // Validate token is not expired
  if (!isTokenValid(csrfToken)) {
    logWarning('CSRF token is expired, request may fail', { context: 'Adding CSRF token' });
    // Don't add expired token - let the request fail and trigger refresh
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
  let response = await fetch(url, optionsWithCsrf);

  // If we get a 403 with CSRF error, try refreshing the token once
  if (response.status === 403) {
    try {
      const errorData = await response.clone().json();
      const csrfErrorCodes = ['CSRF_TOKEN_MISSING', 'CSRF_TOKEN_INVALID', 'CSRF_TOKEN_MISMATCH'];
      
      if (errorData.code && csrfErrorCodes.includes(errorData.code)) {
        logWarning('CSRF token rejected, refreshing and retrying', { 
          context: 'Fetch with CSRF', 
          url, 
          errorCode: errorData.code 
        });
        
        // Force refresh the token
        await ensureCsrfToken(true);
        
        // Retry the request with new token
        const retryOptionsWithCsrf = addCsrfToken(options);
        response = await fetch(url, retryOptionsWithCsrf);
      }
    } catch (error) {
      // If we can't parse the error, just return the original response
      logError(error, { context: 'Parsing CSRF error response' });
    }
  }

  return response;
}
