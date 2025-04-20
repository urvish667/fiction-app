# JWT Security in FableSpace

This document outlines the JWT (JSON Web Token) security implementation in the FableSpace application.

## Overview

FableSpace uses JWT tokens for authentication and authorization. JWTs are securely stored in HTTP-only cookies and validated on both client-side routes (via middleware) and server-side API endpoints (via the `withAuth` utility).

## JWT Configuration

### Token Settings

- **Token Lifetime**: 14 days (configurable in `src/app/api/auth/[...nextauth]/route.ts`)
- **Token Storage**: HTTP-only cookies with secure settings
- **Token Secret**: Stored in environment variable `NEXTAUTH_SECRET`

### Cookie Security

The JWT is stored in a cookie with the following security settings:

- **HTTP-Only**: Prevents JavaScript access to the cookie
- **Secure**: Only sent over HTTPS in production
- **SameSite**: Set to 'lax' to prevent CSRF attacks
- **Path**: Set to '/' to be available across the application

## Protected Routes

### Client-Side Protection

The middleware in `src/middleware.ts` protects client-side routes by:

1. Checking for a valid JWT token
2. Redirecting unauthenticated users to the login page
3. Enforcing profile completion requirements
4. Enforcing email verification requirements

Protected client routes include:
- `/write`
- `/settings`
- `/dashboard`
- `/works`

### API Route Protection

API routes are protected using the `withAuth` and `withAuthAndRoles` utilities from `src/lib/auth/jwt-utils.ts`. These utilities:

1. Verify the JWT token
2. Return 401 Unauthorized if the token is invalid
3. Check for required roles (if specified)
4. Return 403 Forbidden if the user lacks required permissions
5. Provide the decoded token to the route handler

## Implementation Details

### JWT Verification

JWT tokens are verified using NextAuth.js's `getToken` function, which:

1. Extracts the token from the request cookies
2. Verifies the token signature using the secret
3. Checks the token expiration
4. Returns the decoded token payload if valid

### Token Payload

The JWT payload includes:

- **id**: The user's unique ID
- **name**: The user's display name
- **email**: The user's email address
- **image**: The user's profile image URL
- **username**: The user's username
- **isProfileComplete**: Whether the user has completed their profile
- **emailVerified**: Whether the user's email has been verified
- **preferences**: User preferences

## Security Best Practices

The following JWT security best practices are implemented:

1. **Short Token Lifetime**: 14 days instead of the previous 60 days
2. **HTTP-Only Cookies**: Prevents XSS attacks from stealing tokens
3. **Secure Cookies**: Only transmitted over HTTPS in production
4. **SameSite Policy**: Prevents CSRF attacks
5. **Strong Secret**: Using a strong, environment-specific secret
6. **Minimal Payload**: Only including necessary information in the token

## Usage Examples

### Protecting an API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/jwt-utils";

// Protected route - requires authentication
export const GET = withAuth(async (req: NextRequest, token) => {
  // User is authenticated, token contains user information
  const userId = token.id;
  
  // Your route logic here
  return NextResponse.json({ message: "Protected data" });
});
```

### Protecting a Route with Role Requirements

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAuthAndRoles } from "@/lib/auth/jwt-utils";

// Protected route - requires authentication and admin role
export const POST = withAuthAndRoles(
  async (req: NextRequest, token) => {
    // User is authenticated and has admin role
    // Your route logic here
    return NextResponse.json({ message: "Admin action successful" });
  },
  ["admin"] // Required roles
);
```

## Security Recommendations

1. **Rotate the JWT Secret**: Periodically change the `NEXTAUTH_SECRET` value
2. **Monitor Token Usage**: Implement logging for authentication failures
3. **Implement Token Revocation**: Add a mechanism to revoke tokens if needed
4. **Consider Refresh Tokens**: For longer sessions with better security
5. **Add Rate Limiting**: Limit authentication attempts (already implemented)

## References

- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [NextAuth.js Documentation](https://next-auth.js.org/)
