import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { logger } from '@/lib/logger';

// PayPal API base URLs
const PAYPAL_API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await response.json();

  if (!response.ok) {
    logger.error('Failed to get PayPal access token:', data);
    throw new Error('Failed to authenticate with PayPal');
  }

  return data.access_token;
}

// Verify PayPal order
async function verifyPayPalOrder(orderId: string, accessToken: string) {
  try {
    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      logger.error('Failed to verify PayPal order:', data);
      return { verified: false, status: 'ERROR', data };
    }

    return {
      verified: true,
      status: data.status,
      data
    };
  } catch (error) {
    logger.error('Error verifying PayPal order:', error);
    return { verified: false, status: 'ERROR', error };
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get order ID from request body
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();

    // Verify the order
    const verificationResult = await verifyPayPalOrder(orderId, accessToken);

    return NextResponse.json(verificationResult);
  } catch (error) {
    logger.error('Error in PayPal order verification API:', error);
    return NextResponse.json(
      { error: 'Failed to verify PayPal order' },
      { status: 500 }
    );
  }
}
