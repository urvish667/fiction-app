/**
 * API Key Validation Utility
 * 
 * This module provides secure API key validation for the FableSpace application.
 * It implements timing-safe comparison to prevent timing attacks and provides
 * middleware for API key authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { ErrorCode, createErrorResponse } from '../error-handling';

// API key types for different services
export enum ApiKeyType {
  SCHEDULED_TASKS = 'scheduled_tasks',
  WEBHOOKS = 'webhooks',
  EXTERNAL_SERVICE = 'external_service',
  ADMIN = 'admin',
}

// API key configuration
interface ApiKeyConfig {
  // Environment variable name for the API key
  envName: string;
  // Description of the API key
  description: string;
  // Whether to allow fallback to a default key in development
  allowDevFallback: boolean;
}

// API key configurations for different types
const API_KEY_CONFIGS: Record<ApiKeyType, ApiKeyConfig> = {
  [ApiKeyType.SCHEDULED_TASKS]: {
    envName: 'SCHEDULED_TASKS_API_KEY',
    description: 'Scheduled tasks API key',
    allowDevFallback: true,
  },
  [ApiKeyType.WEBHOOKS]: {
    envName: 'WEBHOOK_API_KEY',
    description: 'Webhook API key',
    allowDevFallback: true,
  },
  [ApiKeyType.EXTERNAL_SERVICE]: {
    envName: 'EXTERNAL_SERVICE_API_KEY',
    description: 'External service API key',
    allowDevFallback: false,
  },
  [ApiKeyType.ADMIN]: {
    envName: 'ADMIN_API_KEY',
    description: 'Admin API key',
    allowDevFallback: false,
  },
};

/**
 * Get the API key for a specific type
 * @param type The API key type
 * @returns The API key or null if not configured
 */
export function getApiKey(type: ApiKeyType): string | null {
  const config = API_KEY_CONFIGS[type];
  const key = process.env[config.envName];

  // If key is not set and we're in development, use a fallback
  if (!key && process.env.NODE_ENV === 'development' && config.allowDevFallback) {
    console.warn(`${config.envName} is not set, using fallback key in development`);
    return `dev-${type}-key`;
  }

  return key || null;
}

/**
 * Hash an API key for logging or storage
 * @param key The API key to hash
 * @returns The hashed key
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate an API key using timing-safe comparison
 * @param providedKey The key provided in the request
 * @param expectedKey The expected key
 * @returns Whether the keys match
 */
export function validateApiKey(providedKey: string, expectedKey: string): boolean {
  try {
    // Convert strings to buffers for timing-safe comparison
    const providedBuffer = Buffer.from(providedKey);
    const expectedBuffer = Buffer.from(expectedKey);

    // Use timing-safe comparison to prevent timing attacks
    return providedBuffer.length === expectedBuffer.length && 
           timingSafeEqual(providedBuffer, expectedBuffer);
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}

/**
 * Extract API key from request headers
 * @param req The NextRequest object
 * @returns The API key or null if not found
 */
export function extractApiKey(req: NextRequest): string | null {
  // Check for API key in x-api-key header (preferred)
  const apiKeyHeader = req.headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check for API key in authorization header (Bearer token)
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

/**
 * Middleware to validate API key
 * @param req The NextRequest object
 * @param type The API key type to validate against
 * @returns NextResponse if validation fails, null otherwise
 */
export async function validateApiKeyMiddleware(
  req: NextRequest,
  type: ApiKeyType
): Promise<NextResponse | null> {
  // Get the expected API key
  const expectedKey = getApiKey(type);
  if (!expectedKey) {
    console.error(`API key for ${type} is not configured`);
    return createErrorResponse(
      ErrorCode.INTERNAL_SERVER_ERROR,
      'API key is not configured'
    );
  }

  // Extract the API key from the request
  const providedKey = extractApiKey(req);
  if (!providedKey) {
    return createErrorResponse(
      ErrorCode.UNAUTHORIZED,
      'API key is required'
    );
  }

  // Validate the API key
  const isValid = validateApiKey(providedKey, expectedKey);
  if (!isValid) {
    // Log the attempt with a hashed version of the provided key
    console.warn(`Invalid API key attempt: ${hashApiKey(providedKey)}`);
    
    return createErrorResponse(
      ErrorCode.UNAUTHORIZED,
      'Invalid API key'
    );
  }

  // API key is valid
  return null;
}

/**
 * Middleware to protect API routes with API key authentication
 * @param handler The API route handler
 * @param type The API key type to validate against
 */
export function withApiKey(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  type: ApiKeyType
) {
  return async function apiKeyHandler(req: NextRequest) {
    // Validate the API key
    const validationResult = await validateApiKeyMiddleware(req, type);
    if (validationResult) {
      return validationResult;
    }

    // Call the original handler
    return handler(req);
  };
}

/**
 * Generate a secure random API key
 * @param length The length of the API key (default: 32)
 * @returns A secure random API key
 */
export function generateApiKey(length: number = 32): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = new Uint8Array(length);
  
  // Generate cryptographically secure random values
  crypto.getRandomValues(randomValues);
  
  // Convert random values to characters
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(randomValues[i] % characters.length);
  }
  
  return result;
}
