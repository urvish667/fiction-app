/**
 * Secure API Route Template
 * 
 * This module provides a template for creating secure API routes in the FableSpace application.
 * It demonstrates how to combine all security middleware and implement proper error handling,
 * input validation, and response formatting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Import security middleware
import { withApiKey, ApiKeyType } from '../security/api-key-validation';
import { withApiSecurityHeaders, CacheControl } from '../security/api-headers';
import { withRateLimit, rateLimitConfigs } from '../security/rate-limit';
import { withCsrfProtection } from '../security/csrf';

// Import validation middleware
import { 
  withRequestValidation, 
  HttpMethod,
  ApiValidationSchemas 
} from '../validation/api-validation';

// Import error handling middleware
import { 
  withErrorHandler,
  withErrorHandlingAndMiddleware,
  ResourceNotFoundError,
  ValidationError,
  UnauthorizedError
} from '../validation/error-handler';

// Import authentication middleware
import { withAuth, withAuthAndRoles } from '../auth/jwt-utils';
import { withSession } from '../auth/session-manager';

// Import monitoring middleware
import { withApiLogging } from '../monitoring/api-logger';
import { withSecurityMonitoring } from '../monitoring/security-monitor';

// Import utility for combining middleware
import { combineMiddleware } from '../security/api-headers';

/**
 * Example: Secure GET endpoint with API key authentication
 * 
 * This example demonstrates a secure GET endpoint that requires an API key.
 */
export async function exampleSecureGetWithApiKey(req: NextRequest) {
  // Define the handler function
  async function handler(req: NextRequest) {
    // Your handler logic here
    return NextResponse.json({ message: 'Secure GET endpoint with API key' });
  }
  
  // Apply middleware
  return withErrorHandlingAndMiddleware(
    handler,
    withApiLogging,
    withSecurityMonitoring,
    withApiKey(ApiKeyType.EXTERNAL_SERVICE),
    withApiSecurityHeaders(CacheControl.NO_STORE),
    withRateLimit(rateLimitConfigs.default)
  )(req);
}

/**
 * Example: Secure POST endpoint with JWT authentication and validation
 * 
 * This example demonstrates a secure POST endpoint that requires JWT authentication
 * and validates the request body.
 */
export async function exampleSecurePostWithAuth(req: NextRequest) {
  // Define validation schemas
  const bodySchema = z.object({
    name: z.string().min(1).max(100),
    email: z.string().email(),
    message: z.string().min(10).max(1000),
  });
  
  // Define the handler function
  async function handler(req: NextRequest, validated: { body?: any }) {
    // Your handler logic here
    return NextResponse.json({ 
      message: 'Secure POST endpoint with JWT authentication',
      data: validated.body
    });
  }
  
  // Apply middleware
  return withErrorHandlingAndMiddleware(
    handler,
    withApiLogging,
    withSecurityMonitoring,
    withRequestValidation({
      body: bodySchema,
      allowedMethods: [HttpMethod.POST],
    }),
    withCsrfProtection,
    withAuth,
    withApiSecurityHeaders(CacheControl.NO_STORE),
    withRateLimit(rateLimitConfigs.default)
  )(req);
}

/**
 * Example: Secure PUT endpoint with role-based access control
 * 
 * This example demonstrates a secure PUT endpoint that requires JWT authentication
 * with specific roles and validates the request body.
 */
export async function exampleSecurePutWithRoles(req: NextRequest) {
  // Define validation schemas
  const bodySchema = z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(100),
    content: z.string().min(10).max(10000),
    published: z.boolean().optional(),
  });
  
  // Define the handler function
  async function handler(req: NextRequest, token: any, validated: { body?: any }) {
    // Check if the user is the owner of the resource
    const resourceId = validated.body.id;
    const resource = await fetchResource(resourceId);
    
    if (!resource) {
      throw new ResourceNotFoundError('resource');
    }
    
    if (resource.userId !== token.sub) {
      throw new UnauthorizedError('You do not have permission to update this resource');
    }
    
    // Your handler logic here
    return NextResponse.json({ 
      message: 'Secure PUT endpoint with role-based access control',
      data: validated.body
    });
  }
  
  // Create a wrapper to combine token and validated data
  function handlerWrapper(req: NextRequest, validated: { body?: any }) {
    return async (req: NextRequest, token: any) => {
      return handler(req, token, validated);
    };
  }
  
  // Apply middleware
  return withErrorHandlingAndMiddleware(
    (req: NextRequest, validated: { body?: any }) => {
      // Create a handler that includes the validated data
      const handlerWithValidation = handlerWrapper(req, validated);
      
      // Apply authentication middleware
      return withAuthAndRoles(
        handlerWithValidation,
        ['admin', 'editor']
      )(req);
    },
    withApiLogging,
    withSecurityMonitoring,
    withRequestValidation({
      body: bodySchema,
      allowedMethods: [HttpMethod.PUT],
    }),
    withCsrfProtection,
    withApiSecurityHeaders(CacheControl.NO_STORE),
    withRateLimit(rateLimitConfigs.contentCreation)
  )(req);
}

/**
 * Example: Secure DELETE endpoint with session validation
 * 
 * This example demonstrates a secure DELETE endpoint that requires session validation
 * and validates the request parameters.
 */
export async function exampleSecureDeleteWithSession(req: NextRequest) {
  // Define validation schemas
  const querySchema = z.object({
    id: z.string().uuid(),
  });
  
  // Define the handler function
  async function handler(req: NextRequest, session: any, validated: { query?: any }) {
    // Check if the user is the owner of the resource
    const resourceId = validated.query.id;
    const resource = await fetchResource(resourceId);
    
    if (!resource) {
      throw new ResourceNotFoundError('resource');
    }
    
    if (resource.userId !== session.userId) {
      throw new UnauthorizedError('You do not have permission to delete this resource');
    }
    
    // Your handler logic here
    return NextResponse.json({ 
      message: 'Secure DELETE endpoint with session validation',
      id: resourceId
    });
  }
  
  // Create a wrapper to combine session and validated data
  function handlerWrapper(req: NextRequest, validated: { query?: any }) {
    return async (req: NextRequest, session: any) => {
      return handler(req, session, validated);
    };
  }
  
  // Apply middleware
  return withErrorHandlingAndMiddleware(
    (req: NextRequest, validated: { query?: any }) => {
      // Create a handler that includes the validated data
      const handlerWithValidation = handlerWrapper(req, validated);
      
      // Apply session middleware
      return withSession(handlerWithValidation)(req);
    },
    withApiLogging,
    withSecurityMonitoring,
    withRequestValidation({
      query: querySchema,
      allowedMethods: [HttpMethod.DELETE],
    }),
    withCsrfProtection,
    withApiSecurityHeaders(CacheControl.NO_STORE),
    withRateLimit(rateLimitConfigs.default)
  )(req);
}

/**
 * Example: Secure public endpoint with rate limiting
 * 
 * This example demonstrates a secure public endpoint with rate limiting
 * and caching.
 */
export async function exampleSecurePublicEndpoint(req: NextRequest) {
  // Define the handler function
  async function handler(req: NextRequest) {
    // Your handler logic here
    return NextResponse.json({ 
      message: 'Secure public endpoint with rate limiting',
      timestamp: new Date().toISOString()
    });
  }
  
  // Apply middleware
  return withErrorHandlingAndMiddleware(
    handler,
    withApiLogging,
    withSecurityMonitoring,
    withApiSecurityHeaders(CacheControl.SHORT),
    withRateLimit(rateLimitConfigs.default)
  )(req);
}

// Mock function to fetch a resource
async function fetchResource(id: string) {
  // This is a mock function - in a real implementation,
  // you would fetch the resource from your database
  return {
    id,
    title: 'Example Resource',
    content: 'This is an example resource',
    userId: 'user-123',
  };
}
