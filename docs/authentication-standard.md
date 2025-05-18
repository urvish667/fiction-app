# Authentication Standard for FableSpace

This document outlines the standardized approach to authentication and security in the FableSpace application.

## Overview

FableSpace uses a two-tier security approach:

1. **Global Middleware**: Handles CSRF protection, rate limiting, and security headers for all API routes
2. **Route-Level Authentication**: Uses the `withAuth` middleware for JWT-based authentication

## Authentication Methods

### Standardized Approach: `withAuth` Middleware

All API routes requiring authentication should use the `withAuth` middleware from `@/lib/auth/jwt-utils.ts`. This middleware:

- Verifies JWT tokens with fingerprint validation
- Handles unauthorized responses consistently
- Provides the decoded token to your handler function
- Supports additional options like email verification requirements

```typescript
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/lib/auth/jwt-utils";

export const POST = withAuth(async (req: NextRequest, token) => {
  // User is authenticated, token contains user information
  const userId = token.id;
  
  // Your route logic here
  return NextResponse.json({ success: true });
});
```

### Role-Based Authentication

For routes requiring specific roles, use the `withAuthAndRoles` middleware:

```typescript
import { withAuthAndRoles } from "@/lib/auth/jwt-utils";

export const DELETE = withAuthAndRoles(
  async (req: NextRequest, token) => {
    // User is authenticated and has the required role
    // Your route logic here
  },
  ["admin"] // Required roles
);
```

### Resource Ownership Verification

For routes requiring ownership verification, use the `withResourceOwnership` middleware:

```typescript
import { withResourceOwnership } from "@/lib/auth/jwt-utils";

export const PUT = withResourceOwnership(
  async (req: NextRequest, token, story) => {
    // User is authenticated and owns the resource
    // Your route logic here
  },
  "story",
  (story) => story.authorId
);
```

## CSRF Protection

CSRF protection is handled globally by the middleware in `src/middleware.ts`. This means:

- All non-GET API routes are automatically protected against CSRF attacks
- You don't need to add CSRF protection at the route level
- Exceptions are made for specific routes like NextAuth endpoints

## Converting from `getServerSession`

When converting routes from `getServerSession(authOptions)` to `withAuth`:

1. Remove imports for `getServerSession` and `authOptions`
2. Add import for `withAuth` from `@/lib/auth/jwt-utils`
3. Wrap your handler function with `withAuth`
4. Replace `session.user.id` with `token.id`
5. Remove manual authentication checks

### Before:

```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  // Get the session
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  // Your route logic using session.user.id
}
```

### After:

```typescript
import { withAuth } from "@/lib/auth/jwt-utils";

export const POST = withAuth(async (request: NextRequest, token) => {
  // Your route logic using token.id
});
```

## Security Benefits

This standardized approach provides several security benefits:

1. **Consistent Authentication**: All routes use the same authentication mechanism
2. **Fingerprint Verification**: Helps prevent token theft
3. **Automatic CSRF Protection**: Via global middleware
4. **Role-Based Access Control**: For fine-grained permissions
5. **Resource Ownership**: Ensures users can only access their own resources

## Implementation Checklist

When implementing a new API route:

- [ ] Determine if authentication is required
- [ ] Use `withAuth` for basic authentication
- [ ] Use `withAuthAndRoles` if specific roles are required
- [ ] Use `withResourceOwnership` if ownership verification is needed
- [ ] Remember that CSRF protection is handled globally
- [ ] Test thoroughly with different authentication scenarios
