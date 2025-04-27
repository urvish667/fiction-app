import Stripe from 'stripe';
import { logger } from '@/lib/logger';

// Standard API version to use across the application
const STRIPE_API_VERSION = '2025-03-31.basil';

/**
 * Singleton class for Stripe client
 */
export class StripeClient {
  private static instance: StripeClient;
  private stripe: Stripe;

  private constructor() {
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('STRIPE_SECRET_KEY environment variable is not set');
      throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    }

    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: STRIPE_API_VERSION,
    });
  }

  /**
   * Get the Stripe client instance
   */
  public static getInstance(): Stripe {
    if (!StripeClient.instance) {
      StripeClient.instance = new StripeClient();
    }
    return StripeClient.instance.stripe;
  }
}

/**
 * Get the Stripe client instance
 */
export function getStripeClient(): Stripe {
  return StripeClient.getInstance();
}
