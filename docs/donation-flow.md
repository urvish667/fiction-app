# Donation Flow Documentation

This document outlines the donation flow in FableSpace, including how payments are processed, the components involved, and configuration requirements for production.

## Overview

FableSpace allows readers to support creators through direct donations using PayPal and Stripe. The donation flow consists of:

1. A donation page where users select an amount and payment method
2. Payment processing through either PayPal or Stripe
3. A success page that confirms the donation

## Components

### 1. Donation Page (`src/app/donate/[username]/page.tsx`)

This page allows users to:
- Select a predefined donation amount or enter a custom amount
- Add an optional message to the creator
- Choose between PayPal and Stripe for payment processing

The page uses the `UnifiedPaymentForm` component which dynamically loads either the PayPal or Stripe payment form based on the creator's preferred payment method.

### 2. Payment Processing Components

#### PayPal Integration

- **PayPalPaymentForm** (`src/components/payments/PayPalPaymentForm.tsx`): Handles PayPal payments using the PayPal JavaScript SDK
- **SimplePayPalButton** (`src/components/payments/SimplePayPalButton.tsx`): A fallback component that redirects to PayPal's site if the SDK fails to load

#### Stripe Integration

- **StripePaymentForm** (`src/components/payments/StripePaymentForm.tsx`): Handles Stripe payments using the Stripe Elements SDK

### 3. Success Page (`src/app/donate/success/page.tsx`)

This page is shown after a successful donation and displays:
- A confirmation message
- The donation amount
- The recipient's name
- The user's message (if provided)

### 4. API Endpoints

- **`/api/donations/create`**: Creates a Stripe payment intent
- **`/api/donations/record-paypal`**: Records a PayPal donation in the database
- **`/api/payments/paypal/verify-order`**: Verifies a PayPal order status
- **`/api/user/payment-method`**: Gets a user's preferred payment method
- **`/api/user/paypal-link`**: Gets a user's PayPal link for fallback payments

## Payment Flow

### PayPal Flow

1. User selects an amount and clicks "Support"
2. The PayPal SDK creates an order
3. User completes payment in the PayPal interface
4. On approval, the payment is captured and recorded in the database
5. User is redirected to the success page

### Stripe Flow

1. User selects an amount and clicks "Support"
2. A payment intent is created on the server
3. User enters card details in the Stripe Elements form
4. On submission, the payment is processed and recorded in the database
5. User is redirected to the success page

## Production Configuration

### Environment Variables

For production deployment, the following environment variables must be set:

#### PayPal Configuration

```
# PayPal API credentials (Production)
PAYPAL_CLIENT_ID=your_production_client_id
PAYPAL_CLIENT_SECRET=your_production_client_secret

# PayPal SDK client ID (Production)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_production_client_id
```

#### Stripe Configuration

```
# Stripe API credentials (Production)
STRIPE_SECRET_KEY=your_production_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_publishable_key
```

### Code Changes for Production

The following code changes should be made when moving to production:

1. **PayPal API Base URL**

In `src/app/api/payments/paypal/verify-order/route.ts`, the API base URL is automatically set based on the environment:

```typescript
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
```

2. **Webhook Configuration**

For production, you should set up webhooks for both PayPal and Stripe to handle asynchronous payment events:

- Configure PayPal webhooks in the PayPal Developer Dashboard
- Configure Stripe webhooks in the Stripe Dashboard
- Implement webhook handlers in your API routes

3. **Error Handling**

In production, you may want to enhance error handling by:

- Implementing more detailed logging
- Setting up error monitoring services
- Adding retry mechanisms for failed API calls

4. **Security Considerations**

For production, ensure:

- All API routes are properly authenticated
- CSRF protection is enabled
- Rate limiting is implemented
- Sensitive data is properly encrypted

## Testing in Production

Before going live:

1. Make test donations using real accounts but small amounts
2. Verify that funds are correctly transferred to creators
3. Test the entire flow from different devices and browsers
4. Ensure error handling works correctly for edge cases

## Troubleshooting

Common issues and solutions:

1. **PayPal payments not completing**
   - Check PayPal credentials
   - Verify the PayPal account is properly set up for receiving payments
   - Check for any restrictions on the PayPal account

2. **Stripe payments failing**
   - Verify Stripe API keys
   - Check that the Stripe account is properly configured
   - Ensure the correct webhook endpoints are set up

3. **Success page not showing**
   - Check that session storage is working correctly
   - Verify that the redirect is happening after session storage is set
   - Ensure there are no JavaScript errors preventing the redirect

## Monitoring and Analytics

For production, consider implementing:

1. Payment analytics to track:
   - Conversion rates
   - Average donation amounts
   - Payment method preferences

2. Error monitoring to detect:
   - Failed payments
   - API errors
   - Client-side exceptions

## Future Improvements

Potential enhancements to consider:

1. Recurring donations/subscriptions
2. Additional payment methods
3. Gift donations (donate on behalf of someone else)
4. Donation goals and milestones for creators
