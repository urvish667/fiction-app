# Unified Payment Gateway

This document describes the unified payment gateway implementation for the FableSpace application.

## Overview

The unified payment gateway provides a consistent payment experience for users while allowing creators to receive payments through their preferred payment method (PayPal or Stripe). The system keeps users on the site regardless of payment method and tracks all transactions in a unified database.

## Architecture

The payment system follows a modular architecture with the following components:

### Core Components

1. **Payment Service**: Orchestrates the payment process and routes to the appropriate payment processor
2. **Payment Processors**: Implementations for specific payment methods (Stripe, PayPal)
3. **API Endpoints**: Handle payment requests and webhooks
4. **Frontend Components**: Provide a unified payment experience for users

### Flow Diagram

```
User -> Donation Form -> UnifiedPaymentForm -> Payment Method Detection
                                            -> Stripe: API (/api/donations/create) -> Stripe Payment Intent -> StripePaymentForm
                                            -> PayPal: API (/api/payments/paypal/create-order) -> PayPal Order -> PayPalPaymentForm
```

## Implementation Details

### Payment Service

The `PaymentService` class is responsible for:
- Validating payment requests
- Creating donation records in the database
- Routing payments to the appropriate processor
- Handling errors and responses

### Payment Processors

#### Stripe Processor

The `StripePaymentProcessor` handles payments through Stripe:
- Creates payment intents using Stripe Connect
- Sends funds directly to creator's Stripe account
- Updates donation records with payment status

#### PayPal Processor

The `PayPalPaymentProcessor` handles payments through PayPal:
- Creates PayPal orders through the PayPal JavaScript SDK
- Keeps users on the site during the payment process
- Tracks payment status in the database

### API Endpoints

#### `/api/donations/create`

- **Method**: POST
- **Purpose**: Create a donation and initiate Stripe payment
- **Request Body**:
  ```json
  {
    "recipientId": "user_id",
    "amount": 1000, // in cents
    "message": "Optional message",
    "storyId": "story_id" // Optional story ID
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "donationId": "donation_id",
    "clientSecret": "stripe_client_secret"
  }
  ```

#### `/api/payments/paypal/create-order`

- **Method**: POST
- **Purpose**: Create a PayPal order
- **Request Body**:
  ```json
  {
    "recipientId": "user_id",
    "amount": 1000, // in cents
    "message": "Optional message",
    "storyId": "story_id" // Optional story ID
  }
  ```
- **Response**:
  ```json
  {
    "status": "success",
    "donationId": "donation_id",
    "orderId": "paypal_order_id"
  }
  ```

#### `/api/payments/paypal/capture-payment`

- **Method**: POST
- **Purpose**: Capture a PayPal payment
- **Request Body**:
  ```json
  {
    "orderId": "paypal_order_id"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "donationId": "donation_id",
    "message": "Payment captured successfully"
  }
  ```

#### Webhook Handlers

- `/api/webhooks/stripe`: Handles Stripe payment events
- `/api/webhooks/paypal`: Handles PayPal payment events

### Frontend Components

#### UnifiedPaymentForm

A React component that provides a consistent payment experience:
- Automatically determines the appropriate payment form to display based on the recipient's preferences
- Renders either StripePaymentForm or PayPalPaymentForm based on the payment method
- Handles payment processing and error states
- Provides callbacks for success and error scenarios

#### StripePaymentForm

A React component that handles Stripe payments:
- Uses Stripe Elements for secure payment collection
- Processes payments using Stripe Payment Intents
- Updates the donation status in the database

#### PayPalPaymentForm

A React component that handles PayPal payments:
- Uses the PayPal JavaScript SDK for secure payment collection
- Creates and captures PayPal orders
- Updates the donation status in the database

## Database Schema

### Donation Model

```prisma
model Donation {
  id                   String   @id @default(cuid())
  amount               Int      // Amount in cents
  message              String?
  status               String   @default("pending") // pending, succeeded, failed
  stripePaymentIntentId String? @unique
  paypalOrderId        String? // PayPal order ID for tracking
  paymentMethod        String?  // stripe, paypal
  donorId              String
  donor                User     @relation("DonationsMade", fields: [donorId], references: [id])
  recipientId          String
  recipient            User     @relation("DonationsReceived", fields: [recipientId], references: [id])
  storyId              String?  // ID of the story being donated to (optional)
  story                Story?   @relation(fields: [storyId], references: [id], onDelete: SetNull)
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@index([donorId])
  @@index([recipientId])
  @@index([storyId])
  @@index([status])
  @@index([createdAt])
  @@index([paypalOrderId])
}
```

### User Model (Payment-related fields)

```prisma
model User {
  // Other fields...
  donationLink        String?   // Stripe account ID or PayPal.me link
  donationMethod      String?   // 'stripe' or 'paypal'
  donationsEnabled    Boolean   @default(false)
  // Other fields...
}
```

## Future Enhancements

1. **Enhanced PayPal Integration**:
   - Implement full PayPal API integration (currently using mock orders)
   - Add support for recurring donations
   - Implement PayPal webhook handling for better payment status tracking

2. **Additional Payment Methods**:
   - Add support for Apple Pay, Google Pay, etc.
   - Implement regional payment methods

3. **Reporting and Analytics**:
   - Add dashboard for creators to track donations
   - Provide insights on donation patterns

4. **Subscription Support**:
   - Add support for recurring donations
   - Implement subscription management

## Security Considerations

1. **Webhook Verification**:
   - All webhooks must verify signatures to prevent tampering
   - Implement proper error handling for webhook events

2. **PCI Compliance**:
   - Never store credit card information
   - Use tokenization for all payment methods

3. **Error Handling**:
   - Implement proper error handling for all payment flows
   - Provide clear error messages to users

## Conclusion

The unified payment gateway provides a flexible and user-friendly way to handle donations while allowing creators to receive funds through their preferred payment method. The modular architecture allows for easy addition of new payment methods in the future.
