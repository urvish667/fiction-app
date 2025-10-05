/**
 * Input Validation Utility
 *
 * This module provides centralized input validation for the FableSpace application.
 * It uses Zod for schema validation and provides utilities for sanitizing input.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z, ZodError, ZodSchema } from 'zod';
import DOMPurify from 'isomorphic-dompurify';
import { logError } from '../error-logger';

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param html The HTML content to sanitize
 * @returns The sanitized HTML
 */
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'hr',
      'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
      'em', 'strong', 'del', 'ins', 'mark', 'a', 'img',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span', 'sup', 'sub'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'width', 'height', 'target', 'rel', 'style'
    ],
    FORBID_CONTENTS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    ALLOW_DATA_ATTR: false,
  });
}

/**
 * Sanitize a text string for form inputs (remove HTML but preserve readable characters)
 * @param text The text to sanitize
 * @returns The sanitized text
 */
export function sanitizeText(text: string): string {
  // Remove HTML tags but preserve normal characters like quotes
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&lt;/g, '<') // Decode any existing HTML entities
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, '&') // Decode ampersands last to avoid double-decoding
    .trim(); // Remove leading/trailing whitespace
}

/**
 * Sanitize text for HTML output (encode special characters)
 * @param text The text to sanitize for HTML display
 * @returns The sanitized text with HTML entities
 */
export function sanitizeTextForHtml(text: string): string {
  // Remove HTML tags and encode special characters for safe HTML display
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Sanitize a URL to prevent javascript: and data: URLs
 * @param url The URL to sanitize
 * @returns The sanitized URL or null if the URL is invalid
 */
export function sanitizeUrl(url: string): string | null {
  try {
    // Check if the URL is valid
    const parsedUrl = new URL(url);

    // Only allow http: and https: protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return null;
    }

    return url;
  } catch (error) {
    // URL is invalid
    return null;
  }
}

/**
 * Validate request data against a schema
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @returns The validated data or throws an error
 */
export function validateData<T>(schema: ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Middleware to validate request body against a schema
 * @param schema The Zod schema to validate against
 * @param handler The API route handler
 */
export function withBodyValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, validatedBody: T) => Promise<NextResponse> | NextResponse
) {
  return async function validationHandler(req: NextRequest) {
    try {
      // Parse the request body
      const body = await req.json();

      // Validate the body against the schema
      const validatedBody = validateData(schema, body);

      // Call the original handler with the validated body
      return handler(req, validatedBody);
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        return new NextResponse(
          JSON.stringify({
            error: 'Validation Error',
            message: 'Invalid request data',
            details: error.issues,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Handle other errors
      logError(error, { context: 'Validating request body' })
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An error occurred while processing your request',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
}

/**
 * Middleware to validate request query parameters against a schema
 * @param schema The Zod schema to validate against
 * @param handler The API route handler
 */
export function withQueryValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, validatedQuery: T) => Promise<NextResponse> | NextResponse
) {
  return async function validationHandler(req: NextRequest) {
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

      // Call the original handler with the validated query
      return handler(req, validatedQuery);
    } catch (error) {
      // Handle validation errors
      if (error instanceof ZodError) {
        return new NextResponse(
          JSON.stringify({
            error: 'Validation Error',
            message: 'Invalid query parameters',
            details: error.issues,
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Handle other errors
      logError(error, { context: 'Validating query parameters' })
      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An error occurred while processing your request',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
  };
}

/**
 * Common validation schemas for reuse across the application
 */
export const ValidationSchemas = {
  // User-related schemas
  user: {
    username: z.string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be less than 30 characters")
      .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),

    email: z.string()
      .email("Please enter a valid email address"),

    password: z.string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),

    name: z.string()
      .max(50, "Name is too long")
      .optional(),

    bio: z.string()
      .max(500, "Bio must be less than 500 characters")
      .optional()
      .nullable(),
  },

  // Story-related schemas
  story: {
    title: z.string()
      .min(1, "Title is required")
      .max(100, "Title must be less than 100 characters"),

    description: z.string()
      .min(10, "Description must be at least 10 characters")
      .max(2000, "Description must be less than 2000 characters"),

    tags: z.array(z.string())
      .min(3, "Add at least 3 tags")
      .max(10, "You can add up to 10 tags"),
  },

  // Comment-related schemas
  comment: {
    content: z.string()
      .min(1, "Comment cannot be empty")
      .max(1000, "Comment must be less than 1000 characters"),
  },

  // Common schemas
  common: {
    id: z.string().uuid("Invalid ID format"),

    url: z.string()
      .url("Please enter a valid URL")
      .refine(
        (url) => sanitizeUrl(url) !== null,
        { message: "URL contains invalid protocol" }
      ),

    pagination: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().positive().max(100).default(20),
    }),
  },
};
