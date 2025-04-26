import { NextResponse } from 'next/server';
import { setCsrfCookie } from '@/lib/security/csrf';
import { logger } from '@/lib/logger';

// Create a dedicated logger for the CSRF setup endpoint
const csrfSetupLogger = logger.child('csrf-setup');

/**
 * API endpoint to set up CSRF token
 *
 * This endpoint generates a new CSRF token and sets it in a cookie.
 * It should be called when the application loads to ensure a CSRF token is available.
 */
export async function GET() {
  try {
    // Generate a new CSRF token and set it in a cookie
    const token = await setCsrfCookie();

    // Return a success response with the token in the response
    return NextResponse.json(
      {
        success: true,
        token: token // Include the token in the response for client-side use
      },
      { status: 200 }
    );
  } catch (error) {
    csrfSetupLogger.error('Error setting up CSRF token', { error });

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to set up CSRF token'
      },
      { status: 500 }
    );
  }
}
