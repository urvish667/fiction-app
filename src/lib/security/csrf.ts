/**
 * CSRF Protection Utility
 *
 * This module provides CSRF protection for the FableSpace application.
 * It generates and validates CSRF tokens for non-GET requests.
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Constants
export const CSRF_COOKIE_NAME = 'fablespace_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';
export const CSRF_FORM_FIELD = '_csrf';
const CSRF_TOKEN_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a random string using Web Crypto API
 * @param length The length of the random string
 * @returns A random hex string
 */
async function generateRandomString(length: number): Promise<string> {
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Create a signature for the token
 * @param data The data to sign
 * @param secret The secret to use for signing
 * @returns The signature
 */
async function createSignature(data: string, secret: string): Promise<string> {
  // Convert the data and secret to ArrayBuffer
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const secretBuffer = encoder.encode(secret);

  // Create a key from the secret
  const key = await crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign the data
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    dataBuffer
  );

  // Convert the signature to a hex string
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate a CSRF token
 * @returns The generated CSRF token
 */
export async function generateCsrfToken(): Promise<string> {
  // Generate a random token
  const randomToken = await generateRandomString(32);

  // Create a timestamp for expiration
  const timestamp = Date.now() + CSRF_TOKEN_TTL;

  // Create a signature using the secret
  const signature = await createSignature(
    `${randomToken}:${timestamp}`,
    process.env.CSRF_SECRET || 'fallback-csrf-secret'
  );

  // Combine token, timestamp, and signature
  return `${randomToken}:${timestamp}:${signature}`;
}

/**
 * Validate a CSRF token
 * @param token The CSRF token to validate
 * @returns Whether the token is valid
 */
export async function validateCsrfToken(token: string): Promise<boolean> {
  try {
    // Split the token into its components
    const [randomToken, timestampStr, receivedSignature] = token.split(':');

    // Check if all components are present
    if (!randomToken || !timestampStr || !receivedSignature) {
      return false;
    }

    // Parse the timestamp
    const timestamp = parseInt(timestampStr, 10);

    // Check if the token has expired
    if (Date.now() > timestamp) {
      return false;
    }

    // Recreate the signature
    const expectedSignature = await createSignature(
      `${randomToken}:${timestamp}`,
      process.env.CSRF_SECRET || 'fallback-csrf-secret'
    );

    // Compare the signatures
    return expectedSignature === receivedSignature;
  } catch (error) {
    console.error('CSRF token validation error:', error);
    return false;
  }
}

/**
 * Set a CSRF token in the cookies
 */
export async function setCsrfCookie(): Promise<string> {
  const token = await generateCsrfToken();

  // Set the cookie
  // Await the cookies() function to prevent synchronous access error
  const cookieStore = await cookies();
  cookieStore.set({
    name: CSRF_COOKIE_NAME,
    value: token,
    httpOnly: false, // Allow JavaScript access for client-side CSRF protection
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_TOKEN_TTL / 1000, // Convert to seconds
  });

  return token;
}

/**
 * Get the CSRF token from the cookies
 * @returns The CSRF token or null if not found
 */
export async function getCsrfToken(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE_NAME);
  const token = cookie?.value || null;

  return token;
}

/**
 * Middleware to protect against CSRF attacks
 * @param req The incoming request
 * @returns A response if CSRF validation fails, null otherwise
 */
export async function csrfProtection(req: NextRequest): Promise<NextResponse | null> {
  // Skip CSRF check for GET, HEAD, OPTIONS requests (they should be idempotent)
  const safeMethod = ['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  if (safeMethod) {
    return null;
  }

  // Get the CSRF token from the request
  const csrfToken = req.headers.get(CSRF_HEADER_NAME);

  // Get the CSRF token from the cookies
  const cookieStore = await cookies();
  const cookie = cookieStore.get(CSRF_COOKIE_NAME);
  const cookieToken = cookie?.value;

  // If no token is found, return an error
  if (!csrfToken || !cookieToken) {
    return new NextResponse(
      JSON.stringify({
        error: 'CSRF token missing',
        message: 'CSRF token is required for this request',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Validate the token
  const isValid = await validateCsrfToken(csrfToken);
  if (!isValid || csrfToken !== cookieToken) {
    return new NextResponse(
      JSON.stringify({
        error: 'Invalid CSRF token',
        message: 'CSRF token validation failed',
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Token is valid, continue
  return null;
}

/**
 * Middleware to protect API routes against CSRF attacks
 * @param handler The API route handler
 */
export function withCsrfProtection(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async function csrfHandler(req: NextRequest) {
    // Check CSRF token
    const csrfResult = await csrfProtection(req);

    // If CSRF validation failed, return the error response
    if (csrfResult) {
      return csrfResult;
    }

    // Call the original handler
    return handler(req);
  };
}
