/**
 * Error Handling Utility
 *
 * This module provides standardized error handling for the FableSpace application.
 * It includes utilities for creating consistent error responses and logging errors.
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

// Error codes for different types of errors
export enum ErrorCode {
  // Authentication errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  EMAIL_VERIFICATION_REQUIRED = 'EMAIL_VERIFICATION_REQUIRED',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  NOT_RESOURCE_OWNER = 'NOT_RESOURCE_OWNER',

  // Rate limiting errors
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',

  // Server errors
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // CSRF errors
  CSRF_TOKEN_MISSING = 'CSRF_TOKEN_MISSING',
  CSRF_TOKEN_INVALID = 'CSRF_TOKEN_INVALID',
}

// HTTP status codes for different error types
export const ErrorStatusCodes: Record<ErrorCode, number> = {
  // Authentication errors
  [ErrorCode.UNAUTHORIZED]: 401,
  [ErrorCode.FORBIDDEN]: 403,
  [ErrorCode.INVALID_TOKEN]: 401,
  [ErrorCode.TOKEN_EXPIRED]: 401,
  [ErrorCode.EMAIL_VERIFICATION_REQUIRED]: 403,
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,

  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 400,
  [ErrorCode.INVALID_INPUT]: 400,
  [ErrorCode.MISSING_REQUIRED_FIELD]: 400,

  // Resource errors
  [ErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 409,
  [ErrorCode.NOT_RESOURCE_OWNER]: 403,

  // Rate limiting errors
  [ErrorCode.RATE_LIMIT_EXCEEDED]: 429,

  // Server errors
  [ErrorCode.INTERNAL_SERVER_ERROR]: 500,
  [ErrorCode.DATABASE_ERROR]: 500,
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,

  // CSRF errors
  [ErrorCode.CSRF_TOKEN_MISSING]: 403,
  [ErrorCode.CSRF_TOKEN_INVALID]: 403,
};

// Error response interface
export interface ErrorResponse {
  error: string;
  message: string;
  code: ErrorCode;
  details?: any;
}

/**
 * Create a standardized error response
 * @param code The error code
 * @param message The error message
 * @param details Additional error details
 * @returns A NextResponse with the error information
 */
export function createErrorResponse(
  code: ErrorCode,
  message?: string,
  details?: any
): NextResponse {
  // Get the HTTP status code for this error
  const status = ErrorStatusCodes[code];

  // Create the error response
  const errorResponse: ErrorResponse = {
    error: code.replace(/_/g, ' ').toLowerCase(),
    message: message || getDefaultErrorMessage(code),
    code,
    ...(details && { details }),
  };

  // Log the error if it's a server error
  if (status >= 500) {
    logger.error(`${code}: ${errorResponse.message}`, details);
  }

  // Return the error response
  return NextResponse.json(errorResponse, { status });
}

/**
 * Get a default error message for an error code
 * @param code The error code
 * @returns A default error message
 */
function getDefaultErrorMessage(code: ErrorCode): string {
  switch (code) {
    // Authentication errors
    case ErrorCode.UNAUTHORIZED:
      return 'Authentication is required to access this resource';
    case ErrorCode.FORBIDDEN:
      return 'You do not have permission to access this resource';
    case ErrorCode.INVALID_TOKEN:
      return 'The authentication token is invalid';
    case ErrorCode.TOKEN_EXPIRED:
      return 'The authentication token has expired';
    case ErrorCode.EMAIL_VERIFICATION_REQUIRED:
      return 'Email verification is required to access this resource';
    case ErrorCode.INSUFFICIENT_PERMISSIONS:
      return 'You do not have sufficient permissions to perform this action';

    // Validation errors
    case ErrorCode.VALIDATION_ERROR:
      return 'The request contains invalid data';
    case ErrorCode.INVALID_INPUT:
      return 'The input data is invalid';
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return 'A required field is missing';

    // Resource errors
    case ErrorCode.RESOURCE_NOT_FOUND:
      return 'The requested resource was not found';
    case ErrorCode.RESOURCE_ALREADY_EXISTS:
      return 'The resource already exists';
    case ErrorCode.NOT_RESOURCE_OWNER:
      return 'You do not have permission to access this resource';

    // Rate limiting errors
    case ErrorCode.RATE_LIMIT_EXCEEDED:
      return 'You have exceeded the rate limit for this endpoint';

    // Server errors
    case ErrorCode.INTERNAL_SERVER_ERROR:
      return 'An internal server error occurred';
    case ErrorCode.DATABASE_ERROR:
      return 'A database error occurred';
    case ErrorCode.EXTERNAL_SERVICE_ERROR:
      return 'An error occurred while communicating with an external service';

    // CSRF errors
    case ErrorCode.CSRF_TOKEN_MISSING:
      return 'CSRF token is missing';
    case ErrorCode.CSRF_TOKEN_INVALID:
      return 'CSRF token is invalid';

    default:
      return 'An error occurred';
  }
}

/**
 * Handle errors in an async function
 * @param fn The async function to execute
 * @param defaultErrorCode The default error code to use if an error occurs
 * @returns A function that handles errors
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  defaultErrorCode: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR
): (...args: T) => Promise<R | NextResponse> {
  return async (...args: T) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error('Error in withErrorHandling:', error);

      // If the error is already a NextResponse, return it
      if (error instanceof NextResponse) {
        return error;
      }

      // Create a standardized error response
      return createErrorResponse(
        defaultErrorCode,
        error instanceof Error ? error.message : 'An error occurred',
        process.env.NODE_ENV === 'development' ? error : undefined
      );
    }
  };
}
