# 🪙 PayPal Donation Flow — FableSpace

This document explains the complete PayPal donation flow for FableSpace. It is designed for developers (e.g. Gemini CLI or other agents) to **implement and maintain the flow independently**.

> ✅ Based on the final Prisma schema with: `Donation`, `Payout`, `processorFeeCents`, `platformFeeCents`, `netAmountCents`, and webhook-based confirmation.

---

## 📐 Overview

- Donor donates via PayPal
- Funds go to **FableSpace's PayPal business account**
- Confirmation comes via PayPal **webhook** (not the client)
- Funds are stored and later sent to authors via PayPal **Payouts API**

---

## 🔁 Flow Overview

### 1. Donor Clicks “Support Author”

- File: `src/app/donate/[username]/page.tsx`
- Calls API: `POST /api/donations/create`

### 2. Backend Creates PayPal Order

- File: `src/app/api/donations/create/route.ts`
- Creates `Donation` with `status = pending`
- Calls PayPal API: `paypal.orders.create()`
- Saves returned `paypalOrderId` to the DB
- Returns `paypalOrderId` to frontend

### 3. Frontend Renders PayPal Button

- File: `src/components/payments/PayPalPaymentForm.tsx`
- Uses `createOrder: () => paypalOrderId`
- PayPal handles payment, redirects user

### 4. Webhook Confirms Capture

- File: `src/app/api/webhooks/paypal/route.ts`
- Trigger: `PAYMENT.CAPTURE.COMPLETED`
- Steps:
  1. Validate webhook signature (via `verify-webhook-signature` API)
  2. Extract:
     - `paypalOrderId`
     - `paypal_fee`
     - `gross_amount`
  3. Find matching `Donation`
  4. Update fields:
     ```ts
     donation.status = 'collected'
     donation.processorFeeCents = Math.round(Number(paypal_fee) * 100)
     donation.netAmountCents = amountCents - platformFeeCents - processorFeeCents
     donation.capturedAt = new Date()
     ```

### 5. Donor Sees Success Page

- File: `handlePaymentSuccess()` in DonatePage
- Only UI feedback (no DB updates)

---

## 💸 Payout Phase (Daily Job or Admin Trigger)

### 1. Cron Job or API Endpoint

- File: `scripts/paypal-payout.ts` or `api/admin/payouts/route.ts`
- Select eligible donations:
  ```ts
  const donations = await prisma.donation.findMany({
    where: {
      status: 'collected',
      payoutId: null,
    },
  });
  ```

### 2. Group by recipient

- Sum total `netAmountCents`
- For each recipient:
  - Create `Payout` record
  - Call PayPal Payouts API:
    ```ts
    receiver: user.paypalEmail,
    amount: { value: netAmount / 100, currency: 'USD' }
    ```
  - Update `Donation.payoutId` = new payout ID
  - Set `Payout.status = paid_out`

### 3. Mark Payout Complete

- Set `paidOutAt = new Date()` on each donation
- Set `payout.completedAt = new Date()`

---

## ✅ Important Notes

- Webhook is the **source of truth**
- `/record-paypal` is optional and should NOT write to DB
- Always **verify PayPal signature** on webhook
- Never trust client to confirm payment (always check with PayPal or webhook)
- Use idempotency: never update same donation twice
- Optional: implement minimum payout threshold (e.g. \$5)

---

## 📁 Files to Implement

| File                         | Responsibility                     |
| ---------------------------- | ---------------------------------- |
| `donate/[username]/page.tsx` | Collect donation input             |
| `donations/create/route.ts`  | Create donation + order            |
| `paypalProcessor.ts`         | PayPal API utils (order creation)  |
| `PayPalPaymentForm.tsx`      | Show PayPal button                 |
| `webhooks/paypal/route.ts`   | Confirm payment, update DB         |
| `scripts/paypal-payout.ts`   | Daily payout job                   |
| `api/admin/payouts/route.ts` | (optional) Trigger payout manually |

---

## 🧪 Testing

- Use [PayPal Sandbox](https://developer.paypal.com/dashboard/sandbox)
- Simulate capture via sandbox dashboard or simulated webhook
- Test with amounts like `$1.00`, `$0.99`, etc.
- Ensure emails are configured for both test payer and receiver

---

## ✅ Final Checklist

-

