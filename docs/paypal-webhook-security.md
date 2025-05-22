# PayPal Webhook Security Implementation

## Overview

The PayPal webhook endpoint has been secured with multiple layers of protection to prevent unauthorized access and ensure data integrity.

**Important Note**: PayPal uses **certificate-based verification**, not HMAC with shared secrets like other payment providers.

## Security Measures Implemented

### 1. **Rate Limiting** ⚡
- **Limit**: 10 requests per minute per IP address
- **Purpose**: Prevents DoS attacks and abuse
- **Implementation**: In-memory store (should use Redis in production)

```typescript
// Rate limiting check
if (!checkRateLimit(clientIp)) {
  return new NextResponse('Too Many Requests', { status: 429 });
}
```

### 2. **PayPal Certificate Verification** 🔐
- **Purpose**: Ensures requests are actually from PayPal
- **Method**: Certificate-based verification (not HMAC)
- **Headers Required**:
  - `paypal-transmission-id`
  - `paypal-transmission-time`
  - `paypal-transmission-sig`
  - `paypal-cert-url`
  - `paypal-auth-algo`

```typescript
const isValidWebhook = await verifyPayPalWebhook(
  req.headers,
  rawBody,
  webhookId
);
```

### 3. **Input Validation** ✅
- **Schema Validation**: Using Zod to validate webhook payload structure
- **ID Sanitization**: Removes potentially dangerous characters
- **Required Field Checks**: Ensures all necessary data is present

```typescript
// Sanitize IDs to prevent injection
const sanitizedOrderId = (orderId || transactionId)?.replace(/[^a-zA-Z0-9\-_]/g, '');
```

### 4. **Database Security** 🛡️
- **Transaction Safety**: Uses Prisma transactions for atomic operations
- **Duplicate Prevention**: Checks donation status before processing
- **Selective Queries**: Only processes pending PayPal donations

```typescript
const donation = await prisma.donation.findFirst({
  where: {
    paypalOrderId: sanitizedOrderId,
    paymentMethod: 'paypal',
    status: 'pending' // Only process pending donations
  }
});
```

### 5. **Error Handling & Logging** 📝
- **Comprehensive Logging**: All actions are logged with context
- **Error Isolation**: Notification failures don't affect payment processing
- **Security Monitoring**: Suspicious activities are logged

## Environment Variables Required

Add these to your `.env` file:

```env
# PayPal Configuration
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id
```

**Note**: PayPal does NOT provide a webhook secret. They use certificate-based verification instead.

## Setting Up PayPal Webhooks

### 1. **PayPal Developer Dashboard**
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/)
2. Navigate to your application
3. Go to "Webhooks" section
4. Create a new webhook with URL: `https://yourdomain.com/api/webhooks/paypal`

### 2. **Required Events**
Subscribe to these PayPal events:
- `PAYMENT.CAPTURE.COMPLETED`
- `PAYMENT.CAPTURE.DENIED`
- `PAYMENT.CAPTURE.REFUNDED`

### 3. **Get Webhook ID**
- **Webhook ID**: Found in webhook details (e.g., `1VB149193Y576890N`)
- **No Webhook Secret**: PayPal doesn't provide webhook secrets

## Security Recommendations

### For Production

1. **Use Redis for Rate Limiting**
   ```typescript
   // Replace in-memory store with Redis
   const rateLimitStore = new Redis(process.env.REDIS_URL);
   ```

2. **Implement Full Certificate Verification**
   ```typescript
   // Use PayPal's SDK for production
   import { webhooks } from '@paypal/checkout-server-sdk';
   ```

3. **Add IP Whitelisting**
   ```typescript
   const allowedIPs = process.env.PAYPAL_WEBHOOK_IPS?.split(',') || [];
   if (!allowedIPs.includes(clientIp)) {
     return new NextResponse('Forbidden', { status: 403 });
   }
   ```

4. **Monitor Webhook Health**
   - Set up alerts for failed webhooks
   - Monitor rate limit violations
   - Track signature verification failures

### Security Headers

Add these headers to your webhook responses:

```typescript
const headers = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
};
```

## Testing Security

### 1. **Test Rate Limiting**
```bash
# Send multiple requests quickly
for i in {1..15}; do
  curl -X POST https://yourdomain.com/api/webhooks/paypal
done
```

### 2. **Test Invalid Signatures**
```bash
# Send request without proper headers
curl -X POST https://yourdomain.com/api/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{"event_type": "PAYMENT.CAPTURE.COMPLETED"}'
```

### 3. **Test Input Validation**
```bash
# Send malformed payload
curl -X POST https://yourdomain.com/api/webhooks/paypal \
  -H "Content-Type: application/json" \
  -d '{"invalid": "payload"}'
```

## Common Security Issues to Avoid

1. **❌ No Signature Verification**
   - Anyone can send fake webhooks
   - Can manipulate donation statuses

2. **❌ No Rate Limiting**
   - Vulnerable to DoS attacks
   - Can overwhelm your server

3. **❌ Poor Input Validation**
   - SQL injection risks
   - Data corruption possibilities

4. **❌ Missing Error Handling**
   - Information leakage
   - System instability

## Monitoring & Alerts

Set up monitoring for:
- Failed webhook signature verifications
- Rate limit violations
- Unusual webhook patterns
- Database transaction failures
- Notification creation failures

## Compliance

This implementation helps with:
- **PCI DSS**: Secure payment data handling
- **GDPR**: Proper data validation and logging
- **SOX**: Audit trails and transaction integrity
