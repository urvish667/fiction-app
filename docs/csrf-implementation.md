# CSRF Protection Implementation

This document outlines the Cross-Site Request Forgery (CSRF) protection implementation in FableSpace.

## Overview

CSRF protection prevents attackers from tricking users into performing unwanted actions. Our implementation uses a token-based approach with the following components:

1. Server-side CSRF token generation and validation
2. HTTP-only cookies for secure token storage
3. Client-side utilities for adding tokens to requests
4. Automatic token setup on application load

## Implementation Details

### Server-Side Components

- **CSRF Token Generation**: Located in `src/lib/security/csrf.ts`
  - Generates cryptographically secure random tokens
  - Includes timestamp for expiration
  - Signs tokens with HMAC using a secret key

- **Middleware Protection**: Located in `src/middleware.ts`
  - Validates CSRF tokens for all non-GET API requests
  - Returns 403 Forbidden responses for invalid tokens

- **Token Setup Endpoint**: Located in `src/app/api/csrf/setup/route.ts`
  - Sets a new CSRF token in an HTTP-only cookie
  - Called when the application loads

### Client-Side Components

- **CSRF Provider**: Located in `src/components/csrf-provider.tsx`
  - React component that ensures a CSRF token is set
  - Makes a request to the token setup endpoint on page load

- **Client Utilities**: Located in `src/lib/client/csrf.ts`
  - Functions to get CSRF tokens from cookies
  - Utilities to add CSRF tokens to fetch requests
  - Wrapper for fetch that automatically adds CSRF tokens

- **Service Integration**: All non-GET requests in services use the CSRF utilities
  - Example: `src/services/story-service.ts` uses `fetchWithCsrf` for all mutations

## Usage

### Making API Requests

For any non-GET request to the API, use the `fetchWithCsrf` utility:

```typescript
import { fetchWithCsrf } from '@/lib/client/csrf';

// Example POST request
const response = await fetchWithCsrf('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

### Adding CSRF Protection to New API Routes

The middleware automatically protects all API routes. No additional code is needed for new routes.

## Security Considerations

- CSRF tokens are stored in HTTP-only cookies to prevent JavaScript access
- Tokens include expiration timestamps (24 hours by default)
- Tokens are cryptographically signed to prevent tampering
- The CSRF secret key should be stored in environment variables

## Troubleshooting

If you encounter CSRF token errors:

1. Ensure the CSRF provider is included in your application
2. Check that the CSRF cookie is being set (look in browser dev tools)
3. Verify that non-GET requests include the CSRF token header
4. Check for any CORS issues that might prevent cookies from being sent
