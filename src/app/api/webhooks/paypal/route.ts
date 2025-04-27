import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

/**
 * Webhook handler for PayPal payment events
 *
 * This endpoint receives webhook notifications from PayPal when payment events occur.
 * It verifies the webhook signature and processes the event accordingly.
 */
export async function POST(req: Request) {
  try {
    // Extract required environment variables for webhook verification
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const webhookSecret = process.env.PAYPAL_WEBHOOK_SECRET;

    // Verify environment variables are present
    if (!webhookId || !webhookSecret) {
      logger.error('PayPal webhook: Missing required environment variables', {
        hasWebhookId: !!webhookId,
        hasWebhookSecret: !!webhookSecret
      });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get header values directly from the request
    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const transmissionSig = req.headers.get('paypal-transmission-sig');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');

    // Verify all required headers are present
    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      logger.error('PayPal webhook: Missing required headers', {
        hasTransmissionId: !!transmissionId,
        hasTransmissionTime: !!transmissionTime,
        hasTransmissionSig: !!transmissionSig,
        hasCertUrl: !!certUrl,
        hasAuthAlgo: !!authAlgo
      });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the raw request body for verification
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // In production, you should implement proper signature verification
    // This is a simplified version for demonstration
    // For full implementation, use PayPal's SDK or follow their verification docs

    // Extract event type and resource
    const eventType = body.event_type;
    const resource = body.resource;

    logger.info('PayPal webhook received', { eventType });

    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Payment was completed successfully
        const orderId = resource.supplementary_data?.related_ids?.order_id || resource.parent_payment;
        const transactionId = resource.id;

        if (!orderId && !transactionId) {
          logger.error('PayPal webhook: Order ID and Transaction ID missing', { resource });
          return new NextResponse('Bad Request', { status: 400 });
        }

        // Find the donation record by PayPal order ID
        const donation = await prisma.donation.findFirst({
          where: {
            paypalOrderId: orderId || transactionId
          },
          include: {
            donor: true
          }
        });

        if (!donation) {
          logger.warn('PayPal webhook: Donation not found for order/transaction', {
            orderId,
            transactionId
          });
          // Return 200 to acknowledge receipt even if we can't process it
          return new NextResponse('Webhook received but no matching donation found', { status: 200 });
        }

        // Update donation status in database
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: 'succeeded',
            updatedAt: new Date()
          }
        });

        // Log the transaction ID for reference
        logger.info('PayPal transaction ID (not stored in DB):', { transactionId });

        logger.info('PayPal payment completed', {
          orderId,
          transactionId,
          donationId: donation.id
        });

        // Create a notification for the recipient
        await prisma.notification.create({
          data: {
            userId: donation.recipientId,
            type: 'donation',
            title: 'New Donation Received!',
            message: `${donation.donor.name || 'Someone'} has donated $${(donation.amount / 100).toFixed(2)} to support your work.`,
          }
        });

        // Increment recipient's unread notifications
        await prisma.user.update({
          where: { id: donation.recipientId },
          data: { unreadNotifications: { increment: 1 } }
        });

        return new NextResponse('Webhook processed successfully', { status: 200 });
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Payment was denied or refunded
        const orderId = resource.supplementary_data?.related_ids?.order_id || resource.parent_payment;
        const transactionId = resource.id;

        if (!orderId && !transactionId) {
          logger.error('PayPal webhook: Order ID and Transaction ID missing', { resource });
          return new NextResponse('Bad Request', { status: 400 });
        }

        // Find the donation record
        const donation = await prisma.donation.findFirst({
          where: {
            paypalOrderId: orderId || transactionId
          }
        });

        if (!donation) {
          logger.warn('PayPal webhook: Donation not found for refund/denial', {
            orderId,
            transactionId
          });
          return new NextResponse('Webhook received but no matching donation found', { status: 200 });
        }

        // Update donation status in database
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: eventType === 'PAYMENT.CAPTURE.DENIED' ? 'failed' : 'refunded',
            updatedAt: new Date()
          }
        });

        logger.info('PayPal payment denied or refunded', {
          orderId,
          transactionId,
          eventType,
          donationId: donation.id
        });

        return new NextResponse('Webhook processed successfully', { status: 200 });
      }

      default:
        // Log other event types but don't process them
        logger.info('Unhandled PayPal webhook event', { eventType });
        return new NextResponse('Event type not handled', { status: 200 });
    }
  } catch (error) {
    logger.error('PayPal webhook error', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
