import { NextRequest, NextResponse } from 'next/server';
import { setCsrfCookie, CSRF_COOKIE_NAME } from '@/lib/security/csrf';

/**
 * API endpoint to set up CSRF token
 *
 * This endpoint generates a new CSRF token and sets it in a cookie.
 * It should be called when the application loads to ensure a CSRF token is available.
 */
export async function GET(request: NextRequest) {
  try {
    // Generate a new CSRF token and set it in a cookie
    const token = await setCsrfCookie();

    // Return a success response with the token in the response
    return NextResponse.json(
      {
        success: true,
        token: token // Include the token in the response for client-side use
      },
      {
        status: 200,
        headers: {
          // Set the cookie in the response as well for better compatibility
          'Set-Cookie': `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`
        }
      }
    );
  } catch (error) {
    console.error('Error setting up CSRF token:', error);

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
