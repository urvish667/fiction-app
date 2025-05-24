# OAuth Security in FableSpace

This document outlines the OAuth security implementation in the FableSpace application, particularly focusing on CSRF protection for OAuth providers.

## Overview

FableSpace uses NextAuth.js for authentication, including OAuth providers like Google and X/Twitter. To ensure secure authentication, we've implemented proper CSRF protection using the PKCE (Proof Key for Code Exchange) flow and state parameter validation.

## CSRF Protection for OAuth

Cross-Site Request Forgery (CSRF) attacks can occur during the OAuth flow if proper protections aren't in place. We've implemented the following security measures:

1. **State Parameter**: A cryptographically secure random string that is passed to the OAuth provider and validated when the user is redirected back.
2. **PKCE Flow**: An extension to the OAuth authorization code flow that prevents authorization code interception attacks.

## Implementation Details

### Provider Configuration

Both Google and Facebook providers are configured with PKCE and state parameter validation:

```javascript
// Google OAuth provider with standard configuration
GoogleProvider({
  clientId: process.env.GOOGLE_CLIENT_ID || "",
  clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  // Standard authorization configuration
  authorization: {
    params: {
      scope: "openid email profile",
      prompt: "select_account",
    },
  },
  // Standard state checking for Google
  checks: ["state"],
  // ...
}),

// X/Twitter OAuth provider with improved configuration
TwitterProvider({
  clientId: process.env.TWITTER_CLIENT_ID || "",
  clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
  version: "2.0", // Use OAuth 2.0 for better compatibility
  // Use standard state checking for Twitter
  checks: ["state"],
  // ...
}),
```

### Cookie Configuration

Proper cookie configuration is crucial for OAuth flows to work correctly:

```javascript
// Cookie configuration - optimized for OAuth compatibility
cookies: {
  sessionToken: {
    name: `next-auth.session-token`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === "production", // Secure in production, not in development
    },
  },
  // Explicitly configure the callback cookie used for state
  callbackUrl: {
    name: `next-auth.callback-url`,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === "production",
    },
  },
  // Configure the CSRF token cookie
  csrfToken: {
    name: 'next-auth.csrf-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === "production",
    },
  },
  // Configure the state cookie specifically for OAuth flows
  state: {
    name: 'next-auth.state',
    options: {
      httpOnly: true,
      sameSite: 'lax', // Use 'lax' to ensure it works with redirects
      path: '/',
      secure: process.env.NODE_ENV === "production",
      maxAge: 900, // 15 minutes, matching the state maxAge
    },
  },
},
```

### Error Handling

We've implemented comprehensive error handling for OAuth-related errors:

1. **Server-side Logging**: All OAuth errors are logged with detailed information.
2. **Client-side Error Display**: User-friendly error messages are displayed based on the error type.

### Common OAuth Errors

| Error Code | Description | Solution |
|------------|-------------|----------|
| `OAuthSignin` | Error starting OAuth sign-in | Check provider configuration |
| `OAuthCallback` | Error during OAuth callback | Verify callback URL and state parameter |
| `OAuthCreateAccount` | Error creating OAuth account | Check database connection |
| `OAuthAccountNotLinked` | Email already in use with different provider | User needs to sign in with original provider |
| `Callback` | Generic callback error | Check server logs for details |
| `AccessDenied` | User denied permissions | User needs to approve all required permissions |

## Troubleshooting

### "State missing from the response" Error

This error occurs when the state parameter is not properly maintained during the OAuth flow. For X/Twitter authentication, we use the standard OAuth 2.0 flow with proper state checking:

1. **X/Twitter Provider Configuration**:
   - Use OAuth 2.0 version for better compatibility: `version: "2.0"`
   - Enable standard state checking with `checks: ["state"]`
   - X/Twitter properly supports the state parameter for CSRF protection

2. **Optimized Cookie Configuration**:
   - Explicitly configure all NextAuth.js cookies including `callbackUrl`, `csrfToken`, and `state`
   - Set appropriate `sameSite: 'lax'`, `httpOnly: true`, and `secure` options
   - Configure the state cookie with the same maxAge as the state parameter (900 seconds)
   - Example:
   ```javascript
   state: {
     name: 'next-auth.state',
     options: {
       httpOnly: true,
       sameSite: 'lax',
       path: '/',
       secure: process.env.NODE_ENV === "production",
       maxAge: 900, // 15 minutes
     },
   },
   ```

3. **Environment-Specific Settings**:
   - Use `secure: process.env.NODE_ENV === "production"` to allow non-HTTPS in development
   - Keep security features enabled for Google which typically works well with standard settings

### "Invalid Scopes" Error for Facebook

If you encounter an error like "Invalid Scopes: email", it means the Facebook permissions are not properly formatted. Facebook has specific requirements for requesting permissions:

1. Permissions must be comma-separated without spaces
2. The basic permission `public_profile` is often required
3. Additional permissions like `email` should be explicitly requested

Our solution:
- Changed the scope from just `"email"` to `"public_profile,email"`
- Used the authorization configuration object instead of a direct URL:
```javascript
// CORRECT: Use authorization configuration object
authorization: {
  params: {
    scope: "public_profile,email"
  }
},

```

#### X/Twitter Permission Reference

X/Twitter OAuth 2.0 provides access to basic user information including:

| Scope | Description | Notes |
|-------|-------------|-------|
| `tweet.read` | Read tweets | Basic read access |
| `users.read` | Read user profile information | Includes name, username, profile picture |
| `offline.access` | Refresh token access | For long-term access |

For a complete list of available scopes, refer to [X/Twitter's OAuth 2.0 documentation](https://developer.twitter.com/en/docs/authentication/oauth-2-0).

### Testing OAuth Security

To verify the security of your OAuth implementation:

1. Check that the authorization URL includes a `state` parameter
2. Verify that the callback fails if the state parameter is modified
3. Ensure that error messages are user-friendly and don't expose sensitive information
4. Test the flow on different browsers and devices

## References

- [NextAuth.js OAuth Provider Configuration](https://next-auth.js.org/configuration/providers/oauth)
- [OAuth 2.0 Security Best Practices](https://oauth.net/2/security-best-practices/)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)
