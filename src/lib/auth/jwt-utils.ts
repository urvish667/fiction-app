import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto';
import { logError, logWarning } from '../error-logger';

/**
 * Generate a fingerprint for the client based on headers and IP
 * @param req The Next.js request object
 * @returns A fingerprint string
 */
export function generateFingerprint(req: NextRequest): string {
  // Get client information
  const userAgent = req.headers.get('user-agent') || '';
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  const acceptLanguage = req.headers.get('accept-language') || '';

  // Create a fingerprint using HMAC
  const data = `${ip}:${userAgent}:${acceptLanguage}`;
  const fingerprint = createHmac('sha256', process.env.FINGERPRINT_SECRET || 'fallback-fingerprint-secret')
    .update(data)
    .digest('hex');

  return fingerprint;
}

/**
 * Encrypt sensitive token data
 * @param data The data to encrypt
 * @returns The encrypted data
 */
export function encryptTokenData(data: string): { encryptedData: string, iv: string } {
  // Create a random initialization vector
  const iv = randomBytes(16);

  // Create a cipher using the encryption key
  const cipher = createCipheriv(
    'aes-256-cbc',
    Buffer.from(process.env.JWT_ENCRYPTION_KEY || 'fallback-encryption-key-32-chars-long', 'utf8').slice(0, 32),
    iv
  );

  // Encrypt the data
  let encryptedData = cipher.update(data, 'utf8', 'hex');
  encryptedData += cipher.final('hex');

  return {
    encryptedData,
    iv: iv.toString('hex')
  };
}

/**
 * Decrypt sensitive token data
 * @param encryptedData The encrypted data
 * @param iv The initialization vector
 * @returns The decrypted data
 */
export function decryptTokenData(encryptedData: string, iv: string): string {
  try {
    // Create a decipher using the encryption key
    const decipher = createDecipheriv(
      'aes-256-cbc',
      Buffer.from(process.env.JWT_ENCRYPTION_KEY || 'fallback-encryption-key-32-chars-long', 'utf8').slice(0, 32),
      Buffer.from(iv, 'hex')
    );

    // Decrypt the data
    let decryptedData = decipher.update(encryptedData, 'hex', 'utf8');
    decryptedData += decipher.final('utf8');

    return decryptedData;
  } catch (error) {
    logError(error, { context: 'Decrypting token data' })
    throw new Error('Failed to decrypt token data');
  }
}

/**
 * Verifies that a request has a valid JWT token
 * @param req The Next.js request object
 * @returns The decoded token if valid, null otherwise
 */
export async function verifyJWT(req: NextRequest) {
  try {
    // Get the token from the request with improved configuration for production
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: process.env.NODE_ENV === "production", // Ensure secure cookies in production
      cookieName: "next-auth.session-token" // Explicitly specify the cookie name
    });

    // If no token, return null
    if (!token) {
      return null;
    }

    // Verify token expiration
    if (token.exp && Date.now() >= (token.exp as number) * 1000) {
      logWarning('JWT token has expired', { context: 'Verifying JWT' })
      return null;
    }

    // Verify token fingerprint if present
    if (token.fingerprint) {
      const currentFingerprint = generateFingerprint(req);

      // If fingerprints don't match, token might be stolen
      if (token.fingerprint !== currentFingerprint) {
        logWarning('JWT fingerprint mismatch - possible token theft', { context: 'Verifying JWT' })
        return null;
      }
    }

    return token;
  } catch (error) {
    logError(error, { context: 'Verifying JWT' })
    return null;
  }
}

/**
 * Middleware to protect API routes with JWT authentication
 * @param handler The API route handler
 * @param options Additional options for authentication
 */
export function withAuth(
  handler: (req: NextRequest, token: any) => Promise<NextResponse> | NextResponse,
  options: { requireEmailVerification?: boolean } = {}
) {
  return async function authHandler(req: NextRequest) {
    // Verify the JWT token
    const token = await verifyJWT(req);

    // If no token or invalid token, return 401 Unauthorized
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if email verification is required
    if (options.requireEmailVerification &&
        token.provider === 'credentials' &&
        !token.emailVerified) {
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Email verification required',
          code: 'EMAIL_VERIFICATION_REQUIRED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Call the original handler with the token
    return handler(req, token);
  };
}

/**
 * Middleware to protect API routes with JWT authentication and role check
 * @param handler The API route handler
 * @param requiredRoles Array of roles allowed to access this endpoint
 * @param options Additional options for authentication
 */
export function withAuthAndRoles(
  handler: (req: NextRequest, token: any) => Promise<NextResponse> | NextResponse,
  requiredRoles: string[] = [],
  options: { requireEmailVerification?: boolean } = {}
) {
  return async function authRoleHandler(req: NextRequest) {
    // Verify the JWT token
    const token = await verifyJWT(req);

    // If no token or invalid token, return 401 Unauthorized
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if email verification is required
    if (options.requireEmailVerification &&
        token.provider === 'credentials' &&
        !token.emailVerified) {
      return new NextResponse(
        JSON.stringify({
          error: 'Forbidden',
          message: 'Email verification required',
          code: 'EMAIL_VERIFICATION_REQUIRED'
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // If roles are required, check if the user has the required role
    if (requiredRoles.length > 0) {
      const userRole = token.role || 'user';

      if (!requiredRoles.includes(userRole as string)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Insufficient permissions',
            code: 'INSUFFICIENT_PERMISSIONS'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }
    }

    // Call the original handler with the token
    return handler(req, token);
  };
}

/**
 * Middleware to verify resource ownership
 * @param handler The API route handler
 * @param resourceType The type of resource being accessed
 * @param getResourceOwnerId Function to get the resource owner ID
 */
export function withResourceOwnership<T>(
  handler: (req: NextRequest, token: any, resource: T) => Promise<NextResponse> | NextResponse,
  resourceType: string,
  getResourceOwnerId: (resource: T) => string
) {
  return async function ownershipHandler(req: NextRequest) {
    // Verify the JWT token
    const token = await verifyJWT(req);

    // If no token or invalid token, return 401 Unauthorized
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    try {
      // Get the resource ID from the URL or request body
      const url = new URL(req.url);
      const pathParts = url.pathname.split('/');
      const resourceId = pathParts[pathParts.length - 1];

      // Fetch the resource from the database
      let resource: T | null = null;

      // This is a simplified example - in a real implementation,
      // you would use Prisma to fetch the resource based on resourceType
      // For example:
      // if (resourceType === 'story') {
      //   resource = await prisma.story.findUnique({ where: { id: resourceId } });
      // }

      // If resource not found, return 404
      if (!resource) {
        return new NextResponse(
          JSON.stringify({
            error: 'Not Found',
            message: `${resourceType} not found`,
            code: 'RESOURCE_NOT_FOUND'
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Check if the user is the owner of the resource
      const ownerId = getResourceOwnerId(resource);

      if (ownerId !== token.id) {
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'You do not have permission to access this resource',
            code: 'NOT_RESOURCE_OWNER'
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' }
          }
        );
      }

      // Call the original handler with the token and resource
      return handler(req, token, resource);
    } catch (error) {
      logError(error, { context: 'Verifying resource ownership' })

      return new NextResponse(
        JSON.stringify({
          error: 'Internal Server Error',
          message: 'An error occurred while verifying resource ownership',
          code: 'OWNERSHIP_VERIFICATION_ERROR'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Middleware to combine multiple authentication middlewares
 * @param middlewares Array of middleware functions to apply
 */
export function combineAuthMiddlewares(
  ...middlewares: ((req: NextRequest) => Promise<NextResponse | null>)[]
) {
  return async function combinedMiddleware(req: NextRequest) {
    for (const middleware of middlewares) {
      const result = await middleware(req);

      // If the middleware returns a response, return it
      if (result) {
        return result;
      }
    }

    // All middlewares passed, continue
    return null;
  };
}
