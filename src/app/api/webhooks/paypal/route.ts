import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const PayPalWebhookSchema = z.object({
  event_type: z.string(),
  resource: z.object({
    id: z.string(),
    seller_receivable_breakdown: z.object({
      gross_amount: z.object({
        value: z.string(),
      }),
      paypal_fee: z.object({
        value: z.string(),
      }),
    }),
    custom_id: z.string().optional(),
    supplementary_data: z.object({
      related_ids: z.object({
        order_id: z.string().optional()
      }).optional()
    }).optional(),
  })
});

async function verifyPayPalWebhook(
  headers: Headers,
  body: any
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) {
    logger.error('PayPal webhook: Missing PAYPAL_WEBHOOK_ID environment variable');
    return false;
  }

  const transmissionId = headers.get('paypal-transmission-id');
  const transmissionTime = headers.get('paypal-transmission-time');
  const transmissionSig = headers.get('paypal-transmission-sig');
  const certUrl = headers.get('paypal-cert-url');
  const authAlgo = headers.get('paypal-auth-algo');

  if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
    logger.error('PayPal webhook: Missing required headers for verification');
    return false;
  }

  const paypalApiBase = process.env.NODE_ENV === 'production'
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com';

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${paypalApiBase}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();
  const accessToken = data.access_token;

  const verificationResponse = await fetch(`${paypalApiBase}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: body
    }),
  });

  const verificationResult = await verificationResponse.json();
  return verificationResult.verification_status === 'SUCCESS';
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    const isValidWebhook = await verifyPayPalWebhook(req.headers, body);
    if (!isValidWebhook) {
      logger.error('PayPal webhook: Verification failed');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const validation = PayPalWebhookSchema.safeParse(body);
    if (!validation.success) {
      logger.error('PayPal webhook: Invalid request body format', {
        error: validation.error,
      });
      return new NextResponse('Bad Request', { status: 400 });
    }

    const { event_type, resource } = validation.data;

    if (event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      const orderId = resource.supplementary_data?.related_ids?.order_id;
      if (!orderId) {
        logger.error('PayPal webhook: Order ID missing');
        return new NextResponse('Bad Request', { status: 400 });
      }

      const donation = await prisma.donation.findFirst({
        where: {
          paypalOrderId: orderId,
          status: 'pending',
        },
      });

      if (!donation) {
        logger.warn('PayPal webhook: Donation not found or already processed', {
          orderId,
        });
        return new NextResponse('Webhook received but no matching donation found', { status: 200 });
      }

      const grossAmount = parseFloat(resource.seller_receivable_breakdown.gross_amount.value);
      const paypalFee = parseFloat(resource.seller_receivable_breakdown.paypal_fee.value);
      const amountCents = Math.round(grossAmount * 100);
      const processorFeeCents = Math.round(paypalFee * 100);
      const platformFeeCents = donation.platformFeeCents;
      const netAmountCents = amountCents - platformFeeCents - processorFeeCents;

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: 'collected',
          processorFeeCents,
          netAmountCents,
          capturedAt: new Date(),
        },
      });

      logger.info('PayPal payment completed', {
        orderId,
        donationId: donation.id,
        amount: amountCents,
      });

      return new NextResponse('Webhook processed successfully', { status: 200 });
    }

    return new NextResponse('Event type not handled', { status: 200 });
  } catch (error) {
    logger.error('PayPal webhook error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
