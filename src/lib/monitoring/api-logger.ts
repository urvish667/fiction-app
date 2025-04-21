/**
 * API Logger
 *
 * This module provides structured logging for API requests and responses
 * in the FableSpace application. It includes utilities for tracking request/response
 * cycles and logging security events.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from '../security/rate-limit';
import { logError, logWarning } from '../error-logger';
import { logger } from '../logger';

// Create a dedicated API logger instance
const apiLogger = logger.child('api');

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

// Log entry
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: Record<string, any>;
}

// Request log context
export interface RequestLogContext {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  ip: string;
  userAgent: string;
  referer?: string;
  userId?: string;
  sessionId?: string;
  requestId: string;
  startTime: number;
}

// Response log context
export interface ResponseLogContext {
  statusCode: number;
  responseTime: number;
  contentType?: string;
  contentLength?: number;
  requestId: string;
}

// Security event types
export enum SecurityEventType {
  AUTHENTICATION_FAILURE = 'authentication_failure',
  AUTHORIZATION_FAILURE = 'authorization_failure',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  INVALID_API_KEY = 'invalid_api_key',
  CSRF_FAILURE = 'csrf_failure',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SESSION_REVOKED = 'session_revoked',
  TOKEN_REVOKED = 'token_revoked',
}

// Security event log context
export interface SecurityEventLogContext {
  eventType: SecurityEventType;
  ip: string;
  userAgent: string;
  path: string;
  userId?: string;
  sessionId?: string;
  requestId: string;
  details?: Record<string, any>;
}

// Generate a unique request ID
export function generateRequestId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
}

/**
 * Extract request information for logging
 * @param req The Next.js request object
 * @param requestId The request ID
 * @returns Request log context
 */
export async function extractRequestInfo(
  req: NextRequest,
  requestId: string
): Promise<RequestLogContext> {
  // Get URL information
  const url = new URL(req.url);

  // Get query parameters
  const query: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  // Get client IP
  const ip = await getClientIp(req);

  // Get user agent
  const userAgent = req.headers.get('user-agent') || 'unknown';

  // Get referer
  const referer = req.headers.get('referer') || undefined;

  // Create request context
  return {
    method: req.method,
    url: req.url,
    path: url.pathname,
    query,
    ip,
    userAgent,
    referer,
    requestId,
    startTime: Date.now(),
  };
}

/**
 * Extract response information for logging
 * @param res The Next.js response object
 * @param requestContext The request context
 * @returns Response log context
 */
export function extractResponseInfo(
  res: NextResponse,
  requestContext: RequestLogContext
): ResponseLogContext {
  // Calculate response time
  const responseTime = Date.now() - requestContext.startTime;

  // Get content type
  const contentType = res.headers.get('content-type') || undefined;

  // Get content length
  const contentLength = parseInt(res.headers.get('content-length') || '0', 10) || undefined;

  // Create response context
  return {
    statusCode: res.status,
    responseTime,
    contentType,
    contentLength,
    requestId: requestContext.requestId,
  };
}

/**
 * Log an API request
 * @param context The request log context
 */
export function logApiRequest(context: RequestLogContext): void {
  // Create log entry
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    message: `API Request: ${context.method} ${context.path}`,
    context: {
      ...context,
      type: 'request',
    },
  };

  // Log using the API logger
  apiLogger.info(logEntry.message, {
    method: context.method,
    path: context.path,
    ip: context.ip,
    requestId: context.requestId,
    query: Object.keys(context.query).length > 0 ? context.query : undefined,
  });
}

/**
 * Log an API response
 * @param requestContext The request log context
 * @param responseContext The response log context
 */
export function logApiResponse(
  requestContext: RequestLogContext,
  responseContext: ResponseLogContext
): void {
  // Create log entry
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: responseContext.statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO,
    message: `API Response: ${requestContext.method} ${requestContext.path} ${responseContext.statusCode} (${responseContext.responseTime}ms)`,
    context: {
      ...requestContext,
      ...responseContext,
      type: 'response',
    },
  };

  // Log using the API logger with appropriate level based on status code
  if (responseContext.statusCode >= 500) {
    apiLogger.error(`API Error: ${requestContext.method} ${requestContext.path} ${responseContext.statusCode}`, {
      method: requestContext.method,
      path: requestContext.path,
      statusCode: responseContext.statusCode,
      responseTime: responseContext.responseTime,
      requestId: responseContext.requestId,
    });

    // Also log to error logger for centralized error tracking
    logError(`API Error: ${requestContext.method} ${requestContext.path} ${responseContext.statusCode}`, {
      ...requestContext,
      ...responseContext,
    });
  } else if (responseContext.statusCode >= 400) {
    apiLogger.warn(`API Warning: ${requestContext.method} ${requestContext.path} ${responseContext.statusCode}`, {
      method: requestContext.method,
      path: requestContext.path,
      statusCode: responseContext.statusCode,
      responseTime: responseContext.responseTime,
      requestId: responseContext.requestId,
    });

    // Also log to warning logger for centralized warning tracking
    logWarning(`API Warning: ${requestContext.method} ${requestContext.path} ${responseContext.statusCode}`, {
      ...requestContext,
      ...responseContext,
    });
  } else {
    apiLogger.info(logEntry.message, {
      method: requestContext.method,
      path: requestContext.path,
      statusCode: responseContext.statusCode,
      responseTime: responseContext.responseTime,
      requestId: responseContext.requestId,
    });
  }
}

/**
 * Log a security event
 * @param context The security event log context
 */
export function logSecurityEvent(context: SecurityEventLogContext): void {
  // Create log entry
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.WARN,
    message: `Security Event: ${context.eventType} at ${context.path}`,
    context: {
      ...context,
      type: 'security',
    },
  };

  // Log security events with the API logger
  apiLogger.warn(`Security Event: ${context.eventType}`, {
    eventType: context.eventType,
    path: context.path,
    ip: context.ip,
    userId: context.userId,
    requestId: context.requestId,
    details: context.details,
  });

  // Also log to warning logger for centralized security event tracking
  logWarning(`Security Event: ${context.eventType}`, {
    ...context,
  });
}

/**
 * Middleware to log API requests and responses
 * @param handler The API route handler
 */
export function withApiLogging(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async function loggingHandler(req: NextRequest) {
    // Generate a unique request ID
    const requestId = generateRequestId();

    // Extract request information
    const requestContext = await extractRequestInfo(req, requestId);

    // Log the request
    logApiRequest(requestContext);

    try {
      // Call the original handler
      const response = await handler(req);

      // Add request ID to response headers
      response.headers.set('X-Request-ID', requestId);

      // Extract response information
      const responseContext = extractResponseInfo(response, requestContext);

      // Log the response
      logApiResponse(requestContext, responseContext);

      return response;
    } catch (error) {
      // Log the error
      logError(`API Error: ${requestContext.method} ${requestContext.path}`, {
        ...requestContext,
        error,
      });

      // Re-throw the error to be handled by error middleware
      throw error;
    }
  };
}
