# API Security in FableSpace

This document outlines the security measures implemented to protect FableSpace's API endpoints, with a focus on authentication endpoints.

## Rate Limiting

Rate limiting is implemented to prevent abuse, brute force attacks, and to ensure fair usage of the API. Different endpoints have different rate limits based on their sensitivity and expected usage patterns.

### Implementation Details

Rate limiting is implemented using a combination of:

1. **In-memory store**: For development and small deployments
2. **Redis store** (optional): For production and distributed deployments

The rate limiter tracks requests by IP address and applies limits based on the endpoint being accessed.

### Rate Limits by Endpoint

| Endpoint | Rate Limit | Time Window | Reason |
|----------|------------|-------------|--------|
| `/api/auth/signin/credentials` | 5 requests | 5 minutes | Prevent brute force attacks on login |
| `/api/auth/signin/google` | 10 requests | 10 minutes | Prevent OAuth abuse |
| `/api/auth/signin/facebook` | 10 requests | 10 minutes | Prevent OAuth abuse |
| General auth endpoints | 20 requests | 10 minutes | General protection |
| `/api/auth/signup` | 5 requests | 60 minutes | Prevent mass account creation |
| `/api/auth/username-check` | 20 requests | 1 minute | Allow reasonable username checking during signup |
| `/api/auth/verify-email` | 10 requests | 60 minutes | Prevent verification token abuse |
| Editor endpoints (stories/chapters) | 120 requests | 5 minutes | Support autosave functionality |

### Response Headers

When rate limiting is applied, the following headers are included in the response:

- `X-RateLimit-Limit`: The maximum number of requests allowed in the time window
- `X-RateLimit-Remaining`: The number of requests remaining in the current time window
- `X-RateLimit-Reset`: The time (in Unix seconds) when the rate limit window resets
- `Retry-After`: The number of seconds to wait before making another request

### Rate Limit Exceeded Response

When a rate limit is exceeded, the API returns a `429 Too Many Requests` status code with a JSON response:

```json
{
  "error": "Too many requests",
  "message": "Please try again later."
}
```

## Special Considerations for Autosave Functionality

The story editor in FableSpace uses an autosave feature that periodically saves user content to prevent data loss. This functionality requires special rate limiting considerations:

1. **Higher Rate Limits**: Editor endpoints have higher rate limits (120 requests per 5 minutes) to accommodate frequent autosaves.

2. **Adaptive Backoff**: The editor client implements an adaptive backoff mechanism that:
   - Starts with a 1.5-second debounce for autosaves
   - Increases the delay exponentially (up to 30 seconds) if save attempts fail
   - Resets to normal delay when saves succeed

3. **Cancellation of Pending Saves**: When a user manually saves, any pending autosave is cancelled to prevent race conditions.

4. **Identification of Editor Endpoints**: The middleware identifies editor endpoints by checking for paths that include both `/api/stories/` and `/chapters/`.

This approach balances security (preventing abuse) with user experience (ensuring content is saved reliably).

## Future Security Enhancements

The following security enhancements are planned for future implementation:

1. **API Keys**: For service-to-service authentication and third-party integrations
2. **JWT Scope Validation**: To ensure tokens are only used for their intended purpose
3. **IP Allowlisting**: For admin endpoints
4. **Request Logging and Monitoring**: For detecting and responding to suspicious activity
5. **CAPTCHA Integration**: For high-risk operations

## Redis Configuration (Production)

For production environments, it's recommended to use Redis for rate limiting to ensure limits are enforced across multiple server instances.

To enable Redis for rate limiting:

1. Add the following environment variables:
   ```
   REDIS_URL=redis://username:password@host:port
   RATE_LIMIT_REDIS_ENABLED=true
   ```

2. Update the rate limiter configuration in `src/lib/rate-limit.ts` to use the Redis client.

## Monitoring and Alerts

It's recommended to set up monitoring for rate limit events. A high number of rate limit hits may indicate an attack or a misconfigured client.

Consider implementing alerts when:
- A single IP hits rate limits repeatedly
- Overall rate limit hits exceed a threshold
- Rate limits are hit on sensitive endpoints (e.g., login, admin functions)

## References

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Rate Limiting Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Rate_Limiting_Cheat_Sheet.html)
