/**
 * API Validation Utility
 * 
 * This module provides enhanced validation for API requests in the FableSpace application.
 * It extends the base input validation with API-specific validation and combines
 * multiple validation types (body, query, headers, etc.) into a single middleware.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';
import { ErrorCode, createErrorResponse } from '../error-handling';
import { logError } from '../error-logger';
import { 
  sanitizeHtml, 
  sanitizeText, 
  sanitizeUrl, 
  validateData 
} from '../security/input-validation';

// HTTP methods
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

// Validation options
export interface ValidationOptions {
  // Whether to sanitize inputs after validation
  sanitizeInputs?: boolean;
  // Whether to strip unknown properties from objects
  stripUnknown?: boolean;
  // Custom error message
  errorMessage?: string;
  // Whether to log validation errors
  logErrors?: boolean;
  // Whether to include error details in the response
  includeErrorDetails?: boolean;
}

// Default validation options
const defaultValidationOptions: ValidationOptions = {
  sanitizeInputs: true,
  stripUnknown: true,
  logErrors: true,
  includeErrorDetails: process.env.NODE_ENV !== 'production',
};

/**
 * Sanitize validated data based on its type
 * @param data The data to sanitize
 * @returns The sanitized data
 */
export function sanitizeValidatedData(data: any): any {
  if (typeof data === 'string') {
    return sanitizeText(data);
  }
  
  if (Array.isArray(data)) {
    return data.map(item => sanitizeValidatedData(item));
  }
  
  if (data !== null && typeof data === 'object') {
    const sanitizedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip null or undefined values
      if (value === null || value === undefined) {
        sanitizedData[key] = value;
        continue;
      }
      
      // Sanitize based on key name and value type
      if (key.includes('html') || key.includes('content') || key.includes('description')) {
        sanitizedData[key] = typeof value === 'string' ? sanitizeHtml(value) : sanitizeValidatedData(value);
      } else if (key.includes('url') || key.includes('link') || key.includes('website')) {
        sanitizedData[key] = typeof value === 'string' ? sanitizeUrl(value) || '' : sanitizeValidatedData(value);
      } else {
        sanitizedData[key] = typeof value === 'string' ? sanitizeText(value) : sanitizeValidatedData(value);
      }
    }
    
    return sanitizedData;
  }
  
  return data;
}

/**
 * Handle validation errors
 * @param error The validation error
 * @param options Validation options
 * @returns A NextResponse with the error details
 */
export function handleValidationError(
  error: unknown,
  options: ValidationOptions = {}
): NextResponse {
  const mergedOptions = { ...defaultValidationOptions, ...options };
  
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    // Log the error if enabled
    if (mergedOptions.logErrors) {
      logError('Validation error', {
        errors: error.errors,
        errorType: 'ZodError',
      });
    }
    
    // Create the error response
    return createErrorResponse(
      ErrorCode.VALIDATION_ERROR,
      mergedOptions.errorMessage || 'Invalid request data',
      mergedOptions.includeErrorDetails ? { errors: error.errors } : undefined
    );
  }
  
  // Handle other errors
  if (mergedOptions.logErrors) {
    logError('Unexpected validation error', {
      error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
  }
  
  return createErrorResponse(
    ErrorCode.INTERNAL_SERVER_ERROR,
    'An error occurred while processing your request'
  );
}

/**
 * Validate request body against a schema
 * @param req The NextRequest object
 * @param schema The Zod schema to validate against
 * @param options Validation options
 * @returns The validated body or throws an error
 */
export async function validateRequestBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
): Promise<T> {
  const mergedOptions = { ...defaultValidationOptions, ...options };
  
  try {
    // Parse the request body
    const body = await req.json();
    
    // Validate the body against the schema
    const validatedBody = validateData(schema, body);
    
    // Sanitize the validated body if enabled
    if (mergedOptions.sanitizeInputs) {
      return sanitizeValidatedData(validatedBody) as T;
    }
    
    return validatedBody;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate request query parameters against a schema
 * @param req The NextRequest object
 * @param schema The Zod schema to validate against
 * @param options Validation options
 * @returns The validated query parameters or throws an error
 */
export function validateRequestQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
): T {
  const mergedOptions = { ...defaultValidationOptions, ...options };
  
  try {
    // Get the query parameters
    const url = new URL(req.url);
    const queryParams: Record<string, string> = {};
    
    // Convert URLSearchParams to a plain object
    url.searchParams.forEach((value, key) => {
      queryParams[key] = value;
    });
    
    // Validate the query parameters against the schema
    const validatedQuery = validateData(schema, queryParams);
    
    // Sanitize the validated query if enabled
    if (mergedOptions.sanitizeInputs) {
      return sanitizeValidatedData(validatedQuery) as T;
    }
    
    return validatedQuery;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate request headers against a schema
 * @param req The NextRequest object
 * @param schema The Zod schema to validate against
 * @param options Validation options
 * @returns The validated headers or throws an error
 */
export function validateRequestHeaders<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  options: ValidationOptions = {}
): T {
  const mergedOptions = { ...defaultValidationOptions, ...options };
  
  try {
    // Get the headers
    const headers: Record<string, string> = {};
    
    // Convert headers to a plain object
    req.headers.forEach((value, key) => {
      headers[key] = value;
    });
    
    // Validate the headers against the schema
    const validatedHeaders = validateData(schema, headers);
    
    // No need to sanitize headers
    return validatedHeaders;
  } catch (error) {
    throw error;
  }
}

/**
 * Validate request method
 * @param req The NextRequest object
 * @param allowedMethods Array of allowed HTTP methods
 * @returns NextResponse if validation fails, null otherwise
 */
export function validateRequestMethod(
  req: NextRequest,
  allowedMethods: HttpMethod[]
): NextResponse | null {
  if (!allowedMethods.includes(req.method as HttpMethod)) {
    return createErrorResponse(
      ErrorCode.METHOD_NOT_ALLOWED,
      `Method ${req.method} not allowed. Allowed methods: ${allowedMethods.join(', ')}`,
      { allowedMethods }
    );
  }
  
  return null;
}

/**
 * Middleware to validate request body against a schema
 * @param schema The Zod schema to validate against
 * @param handler The API route handler
 * @param options Validation options
 */
export function withBodyValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, validatedBody: T) => Promise<NextResponse> | NextResponse,
  options: ValidationOptions = {}
) {
  return async function validationHandler(req: NextRequest) {
    try {
      // Validate the request body
      const validatedBody = await validateRequestBody(req, schema, options);
      
      // Call the original handler with the validated body
      return handler(req, validatedBody);
    } catch (error) {
      // Handle validation errors
      return handleValidationError(error, options);
    }
  };
}

/**
 * Middleware to validate request query parameters against a schema
 * @param schema The Zod schema to validate against
 * @param handler The API route handler
 * @param options Validation options
 */
export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, validatedQuery: T) => Promise<NextResponse> | NextResponse,
  options: ValidationOptions = {}
) {
  return async function validationHandler(req: NextRequest) {
    try {
      // Validate the request query
      const validatedQuery = validateRequestQuery(req, schema, options);
      
      // Call the original handler with the validated query
      return handler(req, validatedQuery);
    } catch (error) {
      // Handle validation errors
      return handleValidationError(error, options);
    }
  };
}

/**
 * Middleware to validate request headers against a schema
 * @param schema The Zod schema to validate against
 * @param handler The API route handler
 * @param options Validation options
 */
export function withHeaderValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, validatedHeaders: T) => Promise<NextResponse> | NextResponse,
  options: ValidationOptions = {}
) {
  return async function validationHandler(req: NextRequest) {
    try {
      // Validate the request headers
      const validatedHeaders = validateRequestHeaders(req, schema, options);
      
      // Call the original handler with the validated headers
      return handler(req, validatedHeaders);
    } catch (error) {
      // Handle validation errors
      return handleValidationError(error, options);
    }
  };
}

/**
 * Middleware to validate request method
 * @param allowedMethods Array of allowed HTTP methods
 * @param handler The API route handler
 */
export function withMethodValidation(
  allowedMethods: HttpMethod[],
  handler: (req: NextRequest) => Promise<NextResponse> | NextResponse
) {
  return async function methodValidationHandler(req: NextRequest) {
    // Validate the request method
    const methodValidationResult = validateRequestMethod(req, allowedMethods);
    if (methodValidationResult) {
      return methodValidationResult;
    }
    
    // Call the original handler
    return handler(req);
  };
}

/**
 * Middleware to validate request body, query, and headers against schemas
 * @param schemas The schemas to validate against
 * @param handler The API route handler
 * @param options Validation options
 */
export function withRequestValidation<B, Q, H>(
  schemas: {
    body?: ZodSchema<B>;
    query?: ZodSchema<Q>;
    headers?: ZodSchema<H>;
    allowedMethods?: HttpMethod[];
  },
  handler: (
    req: NextRequest,
    validated: {
      body?: B;
      query?: Q;
      headers?: H;
    }
  ) => Promise<NextResponse> | NextResponse,
  options: ValidationOptions = {}
) {
  return async function validationHandler(req: NextRequest) {
    try {
      const validated: { body?: B; query?: Q; headers?: H } = {};
      
      // Validate request method if specified
      if (schemas.allowedMethods) {
        const methodValidationResult = validateRequestMethod(req, schemas.allowedMethods);
        if (methodValidationResult) {
          return methodValidationResult;
        }
      }
      
      // Validate request body if schema is provided
      if (schemas.body) {
        validated.body = await validateRequestBody(req, schemas.body, options);
      }
      
      // Validate request query if schema is provided
      if (schemas.query) {
        validated.query = validateRequestQuery(req, schemas.query, options);
      }
      
      // Validate request headers if schema is provided
      if (schemas.headers) {
        validated.headers = validateRequestHeaders(req, schemas.headers, options);
      }
      
      // Call the original handler with the validated data
      return handler(req, validated);
    } catch (error) {
      // Handle validation errors
      return handleValidationError(error, options);
    }
  };
}

/**
 * Common API validation schemas for reuse across the application
 */
export const ApiValidationSchemas = {
  // Common schemas
  common: {
    // Pagination schema
    pagination: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    }),
    
    // ID schema
    id: z.string().uuid("Invalid ID format"),
    
    // URL schema
    url: z.string()
      .url("Please enter a valid URL")
      .refine(
        (url) => sanitizeUrl(url) !== null,
        { message: "URL contains invalid protocol" }
      ),
    
    // Date schema
    date: z.string().refine(
      (date) => !isNaN(Date.parse(date)),
      { message: "Invalid date format" }
    ),
    
    // Email schema
    email: z.string().email("Please enter a valid email address"),
  },
  
  // API key schema
  apiKey: z.object({
    'x-api-key': z.string().min(1, "API key is required"),
  }),
  
  // Content-Type schema
  contentType: z.object({
    'content-type': z.string().refine(
      (contentType) => contentType.includes('application/json'),
      { message: "Content-Type must be application/json" }
    ),
  }),
  
  // Authorization schema
  authorization: z.object({
    authorization: z.string().refine(
      (auth) => auth.startsWith('Bearer '),
      { message: "Authorization header must use Bearer scheme" }
    ),
  }),
};

/**
 * Combine multiple middleware functions into a single middleware
 * @param middlewares Array of middleware functions
 */
export function combineValidationMiddleware(
  ...middlewares: ((handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) => 
    (req: NextRequest) => Promise<NextResponse> | NextResponse)[]
) {
  return (handler: (req: NextRequest) => Promise<NextResponse> | NextResponse) => {
    return middlewares.reduceRight((acc, middleware) => middleware(acc), handler);
  };
}
