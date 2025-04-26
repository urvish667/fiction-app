/**
 * Security Monitor
 *
 * This module provides security monitoring for the FableSpace application.
 * It includes utilities for tracking suspicious activity, monitoring authentication
 * failures, and implementing an alert system.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Redis } from 'ioredis';
import { getClientIp } from '../security/rate-limit';
import { logError, logWarning } from '../error-logger';
import { SecurityEventType, logSecurityEvent, generateRequestId } from './api-logger';

// Suspicious activity thresholds
export const SUSPICIOUS_ACTIVITY_THRESHOLDS = {
  // Authentication failures
  AUTH_FAILURES: 5, // 5 failures in the time window
  AUTH_FAILURE_WINDOW: 10 * 60, // 10 minutes

  // Rate limit exceeded
  RATE_LIMIT_EXCEEDED: 10, // 10 rate limit exceeded events in the time window
  RATE_LIMIT_WINDOW: 60 * 60, // 1 hour

  // Invalid API keys
  INVALID_API_KEY: 3, // 3 invalid API key attempts in the time window
  INVALID_API_KEY_WINDOW: 10 * 60, // 10 minutes

  // CSRF failures
  CSRF_FAILURES: 3, // 3 CSRF failures in the time window
  CSRF_FAILURE_WINDOW: 10 * 60, // 10 minutes
};

// Import the global Redis client
import { getRedisClient } from '../redis';

/**
 * Initialize the Redis client for security monitoring
 * Uses the global Redis client singleton to prevent connection cycling
 */
export function initSecurityMonitor(): Redis | null {
  // Check if Redis is enabled for security monitoring
  if (process.env.SECURITY_MONITOR_REDIS_ENABLED !== 'true') {
    return null;
  }

  // Use the global Redis client instead of creating a new one
  return getRedisClient();
}

/**
 * Track a security event
 * @param eventType The type of security event
 * @param ip The client IP address
 * @param path The request path
 * @param userId The user ID (if available)
 * @param details Additional details about the event
 */
export async function trackSecurityEvent(
  eventType: SecurityEventType,
  ip: string,
  path: string,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  // Generate a unique request ID for this event
  const requestId = generateRequestId();

  // Log the security event
  logSecurityEvent({
    eventType,
    ip,
    userAgent: details?.userAgent || 'unknown',
    path,
    userId,
    requestId,
    details,
  });

  // Track the event in Redis if available
  const redis = initSecurityMonitor();
  if (redis) {
    try {
      // Increment the counter for this event type and IP
      const key = `security:${eventType}:${ip}`;
      await redis.incr(key);

      // Set expiration based on event type
      let expiration = 60 * 60; // Default: 1 hour

      switch (eventType) {
        case SecurityEventType.AUTHENTICATION_FAILURE:
          expiration = SUSPICIOUS_ACTIVITY_THRESHOLDS.AUTH_FAILURE_WINDOW;
          break;
        case SecurityEventType.RATE_LIMIT_EXCEEDED:
          expiration = SUSPICIOUS_ACTIVITY_THRESHOLDS.RATE_LIMIT_WINDOW;
          break;
        case SecurityEventType.INVALID_API_KEY:
          expiration = SUSPICIOUS_ACTIVITY_THRESHOLDS.INVALID_API_KEY_WINDOW;
          break;
        case SecurityEventType.CSRF_FAILURE:
          expiration = SUSPICIOUS_ACTIVITY_THRESHOLDS.CSRF_FAILURE_WINDOW;
          break;
      }

      // Set expiration for the key
      await redis.expire(key, expiration);

      // Check if the count exceeds the threshold
      const count = parseInt(await redis.get(key) || '0', 10);

      // Check thresholds based on event type
      let threshold = 0;

      switch (eventType) {
        case SecurityEventType.AUTHENTICATION_FAILURE:
          threshold = SUSPICIOUS_ACTIVITY_THRESHOLDS.AUTH_FAILURES;
          break;
        case SecurityEventType.RATE_LIMIT_EXCEEDED:
          threshold = SUSPICIOUS_ACTIVITY_THRESHOLDS.RATE_LIMIT_EXCEEDED;
          break;
        case SecurityEventType.INVALID_API_KEY:
          threshold = SUSPICIOUS_ACTIVITY_THRESHOLDS.INVALID_API_KEY;
          break;
        case SecurityEventType.CSRF_FAILURE:
          threshold = SUSPICIOUS_ACTIVITY_THRESHOLDS.CSRF_FAILURES;
          break;
      }

      // If the count exceeds the threshold, trigger an alert
      if (threshold > 0 && count >= threshold) {
        await triggerSecurityAlert(eventType, ip, count, userId, details);
      }
    } catch (error) {
      logError('Failed to track security event in Redis', { error, eventType, ip, path, userId });
    }
  }
}

/**
 * Trigger a security alert
 * @param eventType The type of security event
 * @param ip The client IP address
 * @param count The number of events
 * @param userId The user ID (if available)
 * @param details Additional details about the event
 */
export async function triggerSecurityAlert(
  eventType: SecurityEventType,
  ip: string,
  count: number,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  // Log the security alert
  logWarning(`Security Alert: ${eventType} from ${ip} (${count} events)`, {
    eventType,
    ip,
    count,
    userId,
    details,
    timestamp: new Date().toISOString(),
  });

  // In production, you would send this to a security monitoring service
  // or trigger an alert via email, Slack, etc.
  // This is where you would integrate with a security monitoring service
}

/**
 * Track an authentication failure
 * @param req The Next.js request object
 * @param userId The user ID (if available)
 * @param details Additional details about the failure
 */
export async function trackAuthFailure(
  req: NextRequest,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  // Get client IP
  const ip = await getClientIp(req);

  // Get request path
  const path = new URL(req.url).pathname;

  // Track the security event
  await trackSecurityEvent(
    SecurityEventType.AUTHENTICATION_FAILURE,
    ip,
    path,
    userId,
    {
      ...details,
      userAgent: req.headers.get('user-agent') || 'unknown',
    }
  );
}

/**
 * Track an authorization failure
 * @param req The Next.js request object
 * @param userId The user ID
 * @param details Additional details about the failure
 */
export async function trackAuthorizationFailure(
  req: NextRequest,
  userId: string,
  details?: Record<string, any>
): Promise<void> {
  // Get client IP
  const ip = await getClientIp(req);

  // Get request path
  const path = new URL(req.url).pathname;

  // Track the security event
  await trackSecurityEvent(
    SecurityEventType.AUTHORIZATION_FAILURE,
    ip,
    path,
    userId,
    {
      ...details,
      userAgent: req.headers.get('user-agent') || 'unknown',
    }
  );
}

/**
 * Track a rate limit exceeded event
 * @param req The Next.js request object
 * @param userId The user ID (if available)
 * @param details Additional details about the event
 */
export async function trackRateLimitExceeded(
  req: NextRequest,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  // Get client IP
  const ip = await getClientIp(req);

  // Get request path
  const path = new URL(req.url).pathname;

  // Track the security event
  await trackSecurityEvent(
    SecurityEventType.RATE_LIMIT_EXCEEDED,
    ip,
    path,
    userId,
    {
      ...details,
      userAgent: req.headers.get('user-agent') || 'unknown',
    }
  );
}

/**
 * Track an invalid API key event
 * @param req The Next.js request object
 * @param details Additional details about the event
 */
export async function trackInvalidApiKey(
  req: NextRequest,
  details?: Record<string, any>
): Promise<void> {
  // Get client IP
  const ip = await getClientIp(req);

  // Get request path
  const path = new URL(req.url).pathname;

  // Track the security event
  await trackSecurityEvent(
    SecurityEventType.INVALID_API_KEY,
    ip,
    path,
    undefined,
    {
      ...details,
      userAgent: req.headers.get('user-agent') || 'unknown',
    }
  );
}

/**
 * Track a CSRF failure event
 * @param req The Next.js request object
 * @param userId The user ID (if available)
 * @param details Additional details about the event
 */
export async function trackCsrfFailure(
  req: NextRequest,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  // Get client IP
  const ip = await getClientIp(req);

  // Get request path
  const path = new URL(req.url).pathname;

  // Track the security event
  await trackSecurityEvent(
    SecurityEventType.CSRF_FAILURE,
    ip,
    path,
    userId,
    {
      ...details,
      userAgent: req.headers.get('user-agent') || 'unknown',
    }
  );
}

/**
 * Track suspicious activity
 * @param req The Next.js request object
 * @param eventType The type of security event
 * @param userId The user ID (if available)
 * @param details Additional details about the event
 */
export async function trackSuspiciousActivity(
  req: NextRequest,
  eventType: SecurityEventType,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  // Get client IP
  const ip = await getClientIp(req);

  // Get request path
  const path = new URL(req.url).pathname;

  // Track the security event
  await trackSecurityEvent(
    eventType,
    ip,
    path,
    userId,
    {
      ...details,
      userAgent: req.headers.get('user-agent') || 'unknown',
    }
  );
}

/**
 * Middleware to monitor security events
 * @param handler The API route handler
 */
export function withSecurityMonitoring(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async function securityMonitoringHandler(req: NextRequest) {
    try {
      // Call the original handler
      const response = await handler(req);

      // Check for security-related status codes
      if (response.status === 401) {
        // Authentication failure
        await trackAuthFailure(req);
      } else if (response.status === 403) {
        // Authorization failure
        await trackAuthorizationFailure(req, 'unknown');
      } else if (response.status === 429) {
        // Rate limit exceeded
        await trackRateLimitExceeded(req);
      }

      return response;
    } catch (error) {
      // Log the error
      logError('Error in security monitoring middleware', { error });

      // Re-throw the error to be handled by error middleware
      throw error;
    }
  };
}
