/**
 * Enhanced Error Handler
 * 
 * This module provides enhanced error handling for the FableSpace application.
 * It extends the base error handling with additional features like custom error
 * classes, structured logging, and sanitization of error responses.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { ErrorCode, createErrorResponse } from '../error-handling';
import { logError } from '../error-logger';

// Base API error class
export class ApiError extends Error {
  code: ErrorCode;
  status: number;
  details?: any;
  
  constructor(
    code: ErrorCode,
    message: string,
    details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = getStatusCodeForError(code);
    this.details = details;
    
    // Ensure instanceof works correctly
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Authentication errors
export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Authentication is required to access this resource', details?: any) {
    super(ErrorCode.UNAUTHORIZED, message, details);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ApiError {
  constructor(message: string = 'You do not have permission to access this resource', details?: any) {
    super(ErrorCode.FORBIDDEN, message, details);
    this.name = 'ForbiddenError';
  }
}

export class InvalidTokenError extends ApiError {
  constructor(message: string = 'The authentication token is invalid', details?: any) {
    super(ErrorCode.INVALID_TOKEN, message, details);
    this.name = 'InvalidTokenError';
  }
}

export class TokenExpiredError extends ApiError {
  constructor(message: string = 'The authentication token has expired', details?: any) {
    super(ErrorCode.TOKEN_EXPIRED, message, details);
    this.name = 'TokenExpiredError';
  }
}

// Validation errors
export class ValidationError extends ApiError {
  constructor(message: string = 'The request contains invalid data', details?: any) {
    super(ErrorCode.VALIDATION_ERROR, message, details);
    this.name = 'ValidationError';
  }
}

export class InvalidInputError extends ApiError {
  constructor(message: string = 'The input data is invalid', details?: any) {
    super(ErrorCode.INVALID_INPUT, message, details);
    this.name = 'InvalidInputError';
  }
}

export class MissingRequiredFieldError extends ApiError {
  constructor(field: string, message?: string, details?: any) {
    super(
      ErrorCode.MISSING_REQUIRED_FIELD,
      message || `The required field '${field}' is missing`,
      details
    );
    this.name = 'MissingRequiredFieldError';
  }
}

// Resource errors
export class ResourceNotFoundError extends ApiError {
  constructor(resource: string, message?: string, details?: any) {
    super(
      ErrorCode.RESOURCE_NOT_FOUND,
      message || `The requested ${resource} was not found`,
      details
    );
    this.name = 'ResourceNotFoundError';
  }
}

export class ResourceAlreadyExistsError extends ApiError {
  constructor(resource: string, message?: string, details?: any) {
    super(
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      message || `The ${resource} already exists`,
      details
    );
    this.name = 'ResourceAlreadyExistsError';
  }
}

export class NotResourceOwnerError extends ApiError {
  constructor(resource: string, message?: string, details?: any) {
    super(
      ErrorCode.NOT_RESOURCE_OWNER,
      message || `You do not have permission to access this ${resource}`,
      details
    );
    this.name = 'NotResourceOwnerError';
  }
}

// Rate limiting errors
export class RateLimitExceededError extends ApiError {
  constructor(message: string = 'You have exceeded the rate limit for this endpoint', details?: any) {
    super(ErrorCode.RATE_LIMIT_EXCEEDED, message, details);
    this.name = 'RateLimitExceededError';
  }
}

// Server errors
export class InternalServerError extends ApiError {
  constructor(message: string = 'An internal server error occurred', details?: any) {
    super(ErrorCode.INTERNAL_SERVER_ERROR, message, details);
    this.name = 'InternalServerError';
  }
}

export class DatabaseError extends ApiError {
  constructor(message: string = 'A database error occurred', details?: any) {
    super(ErrorCode.DATABASE_ERROR, message, details);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends ApiError {
  constructor(service: string, message?: string, details?: any) {
    super(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      message || `An error occurred while communicating with ${service}`,
      details
    );
    this.name = 'ExternalServiceError';
  }
}

// CSRF errors
export class CsrfTokenMissingError extends ApiError {
  constructor(message: string = 'CSRF token is missing', details?: any) {
    super(ErrorCode.CSRF_TOKEN_MISSING, message, details);
    this.name = 'CsrfTokenMissingError';
  }
}

export class CsrfTokenInvalidError extends ApiError {
  constructor(message: string = 'CSRF token is invalid', details?: any) {
    super(ErrorCode.CSRF_TOKEN_INVALID, message, details);
    this.name = 'CsrfTokenInvalidError';
  }
}

// Method not allowed error
export class MethodNotAllowedError extends ApiError {
  constructor(method: string, allowedMethods: string[], details?: any) {
    super(
      ErrorCode.METHOD_NOT_ALLOWED,
      `Method ${method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      { allowedMethods, ...details }
    );
    this.name = 'MethodNotAllowedError';
  }
}

/**
 * Get the HTTP status code for an error code
 * @param code The error code
 * @returns The HTTP status code
 */
function getStatusCodeForError(code: ErrorCode): number {
  const statusCodes: Record<ErrorCode, number> = {
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
    [ErrorCode.METHOD_NOT_ALLOWED]: 405,
    
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
  
  return statusCodes[code] || 500;
}

/**
 * Sanitize error details for production
 * @param error The error object
 * @returns Sanitized error details
 */
function sanitizeErrorDetails(error: any): any {
  // In production, remove sensitive information
  if (process.env.NODE_ENV === 'production') {
    // If it's a database error, remove query details
    if (error && error.code === ErrorCode.DATABASE_ERROR) {
      const { query, params, ...safeDetails } = error.details || {};
      return safeDetails;
    }
    
    // If it's a server error, remove stack traces
    if (error && error.code && [
      ErrorCode.INTERNAL_SERVER_ERROR,
      ErrorCode.DATABASE_ERROR,
      ErrorCode.EXTERNAL_SERVICE_ERROR
    ].includes(error.code)) {
      const { stack, ...safeDetails } = error.details || {};
      return safeDetails;
    }
  }
  
  return error.details;
}

/**
 * Handle API errors
 * @param error The error object
 * @returns A NextResponse with the error information
 */
export function handleApiError(error: unknown): NextResponse {
  // If the error is an ApiError, use its properties
  if (error instanceof ApiError) {
    // Log server errors
    if (error.status >= 500) {
      logError(error, {
        code: error.code,
        details: error.details,
      });
    }
    
    // Create the error response
    return createErrorResponse(
      error.code,
      error.message,
      sanitizeErrorDetails(error)
    );
  }
  
  // If the error is a Zod validation error, convert it to a ValidationError
  if (error instanceof ZodError) {
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      'The request contains invalid data',
      process.env.NODE_ENV === 'production' ? undefined : { errors: error.issues }
    );
  }
  
  // For other errors, log them and return a generic error
  logError(error, {
    errorType: error instanceof Error ? error.constructor.name : typeof error,
  });
  
  return createErrorResponse(
    ErrorCode.INTERNAL_SERVER_ERROR,
    error instanceof Error ? error.message : 'An unexpected error occurred',
    process.env.NODE_ENV === 'production' ? undefined : { error }
  );
}

/**
 * Middleware to handle errors in API routes
 * @param handler The API route handler
 */
export function withErrorHandler(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async function errorHandlerMiddleware(req: NextRequest) {
    try {
      // Call the original handler
      return await handler(req);
    } catch (error) {
      // Handle the error
      return handleApiError(error);
    }
  };
}

/**
 * Combine error handling with other middleware
 * @param handler The API route handler
 * @param middlewares Array of middleware functions to apply before error handling
 */
export function withErrorHandlingAndMiddleware(
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse,
  ...middlewares: ((handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) => 
    (req: NextRequest) => Promise<NextResponse> | NextResponse)[]
) {
  // Apply middlewares in reverse order (last middleware is applied first)
  const handlerWithMiddleware = middlewares.reduceRight(
    (acc, middleware) => middleware(acc),
    handler
  );
  
  // Apply error handling last (outermost)
  return withErrorHandler(handlerWithMiddleware);
}
