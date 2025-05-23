import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { createDonationNotification } from '@/lib/notification-helpers';
import { z } from 'zod';

/**
 * Webhook handler for PayPal payment events
 *
 * This endpoint receives webhook notifications from PayPal when payment events occur.
 * It verifies the webhook signature and processes the event accordingly.
 */

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// PayPal webhook event schema for validation
const PayPalWebhookSchema = z.object({
  event_type: z.string(),
  resource: z.object({
    id: z.string(),
    supplementary_data: z.object({
      related_ids: z.object({
        order_id: z.string().optional()
      }).optional()
    }).optional(),
    parent_payment: z.string().optional()
  })
});

// Helper function to check rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 10; // 10 requests per minute

  let record = rateLimitStore.get(ip);
  if (!record || record.resetTime <= now) {
    record = { count: 0, resetTime: now + windowMs };
    rateLimitStore.set(ip, record);
  }

  record.count += 1;
  return record.count <= maxRequests;
}

// PayPal webhook verification using their API
async function verifyPayPalWebhook(
  headers: Headers,
  body: string,
  webhookId: string
): Promise<boolean> {
  try {
    // Get required headers
    const transmissionId = headers.get('paypal-transmission-id');
    const transmissionTime = headers.get('paypal-transmission-time');
    const transmissionSig = headers.get('paypal-transmission-sig');
    const certUrl = headers.get('paypal-cert-url');
    const authAlgo = headers.get('paypal-auth-algo');

    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      logger.error('PayPal webhook: Missing required headers for verification');
      return false;
    }

    // Basic validation of PayPal headers format
    if (!transmissionId.match(/^[A-Za-z0-9\-]+$/)) {
      logger.error('PayPal webhook: Invalid transmission ID format');
      return false;
    }

    if (!certUrl.startsWith('https://api.paypal.com/') && !certUrl.startsWith('https://api.sandbox.paypal.com/')) {
      logger.error('PayPal webhook: Invalid certificate URL');
      return false;
    }

    // Validate timestamp (reject webhooks older than 5 minutes)
    const webhookTime = parseInt(transmissionTime);
    const currentTime = Math.floor(Date.now() / 1000);
    const timeDiff = Math.abs(currentTime - webhookTime);

    if (timeDiff > 300) { // 5 minutes
      logger.error('PayPal webhook: Timestamp too old', {
        webhookTime,
        currentTime,
        timeDiff
      });
      return false;
    }

    // Get PayPal access token for verification
    const accessToken = await getPayPalAccessToken();
    if (!accessToken) {
      logger.error('PayPal webhook: Failed to get access token for verification');
      return false;
    }

    // Use PayPal's webhook verification API
    const verificationData = {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      cert_id: transmissionId, // PayPal uses transmission_id as cert_id
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: JSON.parse(body)
    };

    // const paypalApiBase = process.env.NODE_ENV === 'production'
    //   ? 'https://api.paypal.com'
    //   : 'https://api.sandbox.paypal.com';

    const paypalApiBase = 'https://api.sandbox.paypal.com';

    const verificationResponse = await fetch(`${paypalApiBase}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(verificationData),
    });

    const verificationResult = await verificationResponse.json();

    if (verificationResponse.ok && verificationResult.verification_status === 'SUCCESS') {
      logger.info('PayPal webhook: Verification successful');
      return true;
    } else {
      logger.error('PayPal webhook: Verification failed', {
        status: verificationResponse.status,
        result: verificationResult
      });
      return false;
    }
  } catch (error) {
    logger.error('PayPal webhook verification error:', error);
    return false;
  }
}

// Get PayPal access token for webhook verification
async function getPayPalAccessToken(): Promise<string | null> {
  try {
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      logger.error('PayPal webhook: Missing client credentials');
      return null;
    }

    const paypalApiBase = process.env.NODE_ENV === 'production'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await fetch(`${paypalApiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('PayPal webhook: Failed to get access token:', data);
      return null;
    }

    return data.access_token;
  } catch (error) {
    logger.error('PayPal webhook: Error getting access token:', error);
    return null;
  }
}

// PayPal's known IP ranges for webhook delivery (for additional security)
const PAYPAL_WEBHOOK_IPS = [
  '173.0.82.126/32',
  '173.0.82.127/32',
  '173.0.82.128/32',
  '173.0.82.129/32',
  '173.0.82.130/32',
  '173.0.82.131/32',
  // Add more PayPal IPs as needed
];

// Function to check if IP is in CIDR range
function isIpInRange(ip: string, cidr: string): boolean {
  try {
    const [range, bits] = cidr.split('/');
    const mask = ~(2 ** (32 - parseInt(bits)) - 1);
    return (ip2int(ip) & mask) === (ip2int(range) & mask);
  } catch {
    return false;
  }
}

function ip2int(ip: string): number {
  return ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;
}

function validatePayPalIP(clientIp: string): boolean {
  // Skip IP validation in development
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  // Check if IP is from PayPal
  return PAYPAL_WEBHOOK_IPS.some(range => isIpInRange(clientIp, range));
}

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting and validation
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') ||
                     req.headers.get('cf-connecting-ip') ||
                     'unknown';

    // Validate PayPal IP (optional additional security)
    if (process.env.PAYPAL_WEBHOOK_IP_VALIDATION === 'true' && !validatePayPalIP(clientIp)) {
      logger.warn('PayPal webhook: Request from non-PayPal IP', { clientIp });
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Check rate limiting
    if (!checkRateLimit(clientIp)) {
      logger.warn('PayPal webhook: Rate limit exceeded', { clientIp });
      return new NextResponse('Too Many Requests', { status: 429 });
    }

    // Extract required environment variables for webhook verification
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;

    // Verify webhook ID is present
    if (!webhookId) {
      logger.error('PayPal webhook: Missing PAYPAL_WEBHOOK_ID environment variable');
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get the raw request body for verification
    const rawBody = await req.text();

    // Verify webhook headers are present (basic verification)
    const transmissionId = req.headers.get('paypal-transmission-id');
    const transmissionTime = req.headers.get('paypal-transmission-time');
    const transmissionSig = req.headers.get('paypal-transmission-sig');
    const certUrl = req.headers.get('paypal-cert-url');
    const authAlgo = req.headers.get('paypal-auth-algo');

    // Basic header validation (PayPal always sends these)
    if (!transmissionId || !transmissionTime || !transmissionSig || !certUrl || !authAlgo) {
      logger.error('PayPal webhook: Missing required PayPal headers', {
        hasTransmissionId: !!transmissionId,
        hasTransmissionTime: !!transmissionTime,
        hasTransmissionSig: !!transmissionSig,
        hasCertUrl: !!certUrl,
        hasAuthAlgo: !!authAlgo,
        clientIp
      });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Log webhook verification details for debugging
    logger.info('PayPal webhook headers received', {
      transmissionId,
      transmissionTime,
      authAlgo,
      certUrl: certUrl.substring(0, 50) + '...', // Log partial URL for security
      clientIp
    });

    // Verify webhook authenticity using PayPal's certificate-based verification
    const isValidWebhook = await verifyPayPalWebhook(req.headers, rawBody, webhookId);
    if (!isValidWebhook) {
      logger.error('PayPal webhook: Verification failed', { clientIp });
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Parse and validate the request body
    let body;
    try {
      body = JSON.parse(rawBody);
      PayPalWebhookSchema.parse(body);
    } catch (parseError) {
      logger.error('PayPal webhook: Invalid request body format', {
        error: parseError,
        clientIp
      });
      return new NextResponse('Bad Request', { status: 400 });
    }

    // Extract event type and resource
    const eventType = body.event_type;
    const resource = body.resource;

    logger.info('PayPal webhook received', { eventType, clientIp });

    // Handle different event types
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED': {
        // Payment was completed successfully
        const orderId = resource.supplementary_data?.related_ids?.order_id || resource.parent_payment;
        const transactionId = resource.id;

        // Validate required fields
        if (!orderId && !transactionId) {
          logger.error('PayPal webhook: Order ID and Transaction ID missing', {
            resource: JSON.stringify(resource),
            clientIp
          });
          return new NextResponse('Bad Request', { status: 400 });
        }

        // Sanitize IDs to prevent injection
        const sanitizedOrderId = (orderId || transactionId)?.replace(/[^a-zA-Z0-9\-_]/g, '');
        if (!sanitizedOrderId) {
          logger.error('PayPal webhook: Invalid order/transaction ID format', {
            orderId,
            transactionId,
            clientIp
          });
          return new NextResponse('Bad Request', { status: 400 });
        }

        // Find the donation record by PayPal order ID with additional security checks
        // Look for both pending and succeeded donations to handle different creation flows
        const donation = await prisma.donation.findFirst({
          where: {
            paypalOrderId: sanitizedOrderId,
            paymentMethod: 'paypal', // Ensure it's a PayPal donation
            status: { in: ['pending', 'succeeded'] } // Process both pending and succeeded donations
          },
          include: {
            donor: {
              select: { id: true, username: true, name: true }
            },
            recipient: {
              select: { id: true, username: true, name: true }
            },
            story: {
              select: { id: true, title: true, slug: true }
            }
          }
        });

        if (!donation) {
          logger.warn('PayPal webhook: Donation not found or already processed', {
            orderId: sanitizedOrderId,
            transactionId,
            clientIp
          });
          // Return 200 to acknowledge receipt even if we can't process it
          return new NextResponse('Webhook received but no matching donation found', { status: 200 });
        }

        // Check if donation is already succeeded and if notification might already exist
        if (donation.status === 'succeeded') {
          // Check if notification already exists for this donation
          const existingNotification = await prisma.notification.findFirst({
            where: {
              userId: donation.recipientId,
              type: 'donation',
              content: {
                path: ['donationId'],
                equals: donation.id
              }
            }
          });

          if (existingNotification) {
            logger.info('PayPal webhook: Donation already processed with notification', {
              donationId: donation.id,
              orderId: sanitizedOrderId,
              notificationId: existingNotification.id,
              clientIp
            });
            return new NextResponse('Donation already processed with notification', { status: 200 });
          }

          logger.info('PayPal webhook: Donation succeeded but notification missing, will create notification', {
            donationId: donation.id,
            orderId: sanitizedOrderId,
            clientIp
          });
        } else {
          // Update donation status to succeeded if it's still pending
          await prisma.$transaction(async (tx) => {
            await tx.donation.update({
              where: { id: donation.id },
              data: {
                status: 'succeeded',
                updatedAt: new Date()
              }
            });

            // Log the successful payment
            logger.info('PayPal payment completed', {
              orderId: sanitizedOrderId,
              transactionId,
              donationId: donation.id,
              amount: donation.amount,
              clientIp
            });
          });
        }

        // Create notification with enhanced error handling
        try {
          // Validate notification data
          if (!donation.recipientId || !donation.donorId) {
            throw new Error('Missing required user IDs for notification');
          }

          const actorUsername = donation.donor.username || donation.donor.name;
          if (!actorUsername) {
            logger.warn('PayPal webhook: Donor has no username or name', {
              donationId: donation.id,
              donorId: donation.donorId
            });
          }

          await createDonationNotification({
            recipientId: donation.recipientId,
            actorId: donation.donorId,
            actorUsername: actorUsername || 'Anonymous',
            donationId: donation.id,
            amount: donation.amount,
            message: donation.message || undefined,
            storyId: donation.storyId || undefined,
            storyTitle: donation.story?.title,
            storySlug: donation.story?.slug,
          });

          logger.info('Donation notification created successfully', {
            donationId: donation.id,
            recipientId: donation.recipientId,
            donorId: donation.donorId,
            amount: donation.amount,
            clientIp
          });
        } catch (notificationError) {
          logger.error('Failed to create donation notification', {
            error: notificationError instanceof Error ? notificationError.message : String(notificationError),
            stack: notificationError instanceof Error ? notificationError.stack : undefined,
            donationId: donation.id,
            recipientId: donation.recipientId,
            donorId: donation.donorId,
            clientIp
          });
          // Don't fail the webhook if notification creation fails
          // The payment was successful, notification failure shouldn't affect that
        }

        return new NextResponse('Webhook processed successfully', { status: 200 });
      }

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.REFUNDED': {
        // Payment was denied or refunded
        const orderId = resource.supplementary_data?.related_ids?.order_id || resource.parent_payment;
        const transactionId = resource.id;

        // Validate required fields
        if (!orderId && !transactionId) {
          logger.error('PayPal webhook: Order ID and Transaction ID missing for refund/denial', {
            resource: JSON.stringify(resource),
            clientIp
          });
          return new NextResponse('Bad Request', { status: 400 });
        }

        // Sanitize IDs
        const sanitizedOrderId = (orderId || transactionId)?.replace(/[^a-zA-Z0-9\-_]/g, '');
        if (!sanitizedOrderId) {
          logger.error('PayPal webhook: Invalid order/transaction ID format for refund/denial', {
            orderId,
            transactionId,
            clientIp
          });
          return new NextResponse('Bad Request', { status: 400 });
        }

        // Find the donation record with security checks
        const donation = await prisma.donation.findFirst({
          where: {
            paypalOrderId: sanitizedOrderId,
            paymentMethod: 'paypal'
          }
        });

        if (!donation) {
          logger.warn('PayPal webhook: Donation not found for refund/denial', {
            orderId: sanitizedOrderId,
            transactionId,
            clientIp
          });
          return new NextResponse('Webhook received but no matching donation found', { status: 200 });
        }

        // Determine new status
        const newStatus = eventType === 'PAYMENT.CAPTURE.DENIED' ? 'failed' : 'refunded';

        // Update donation status in database with transaction
        await prisma.$transaction(async (tx) => {
          await tx.donation.update({
            where: { id: donation.id },
            data: {
              status: newStatus,
              updatedAt: new Date()
            }
          });

          logger.info('PayPal payment denied or refunded', {
            orderId: sanitizedOrderId,
            transactionId,
            eventType,
            donationId: donation.id,
            newStatus,
            clientIp
          });
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
