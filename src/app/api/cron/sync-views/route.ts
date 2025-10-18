/**
 * API Route: Sync Buffered Views Cron Job
 * 
 * This endpoint is called by a cron service (e.g., Vercel Cron, GitHub Actions, etc.)
 * to periodically sync buffered views from Redis to the database.
 * 
 * Schedule: Every 12 hours (configurable)
 * Authentication: Requires CRON_SECRET for security
 */

import { NextRequest, NextResponse } from 'next/server';
import { syncBufferedViews } from '@/lib/jobs/sync-views';
import { logger } from '@/lib/logger';

/**
 * POST /api/cron/sync-views
 * Trigger the view sync job
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      logger.error('CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    // Debug logging
    logger.info('Auth comparison debug', {
      authHeaderLength: authHeader?.length,
      cronSecretLength: cronSecret.length,
      expectedLength: `Bearer ${cronSecret}`.length,
      authHeaderPreview: authHeader?.substring(0, 20) + '...',
      expectedPreview: `Bearer ${cronSecret}`.substring(0, 20) + '...',
    });

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron job attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Run the sync job
    logger.info('Cron job triggered: sync-views');
    const metrics = await syncBufferedViews();

    return NextResponse.json({
      success: metrics.success,
      message: 'View sync completed',
      metrics: {
        duration: `${metrics.duration}ms`,
        storiesProcessed: metrics.storiesProcessed,
        chaptersProcessed: metrics.chaptersProcessed,
        totalViewsAdded: metrics.storyViewsAdded + metrics.chapterViewsAdded,
        errors: metrics.errors,
      },
    });
  } catch (error) {
    logger.error('Cron job failed:', error);
    return NextResponse.json(
      { error: 'Cron job failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/cron/sync-views
 * Get information about the sync job (for monitoring)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: 'Cron job not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Return job configuration
    return NextResponse.json({
      job: 'sync-views',
      schedule: process.env.VIEW_SYNC_CRON || '0 2,14 * * *',
      interval: `${process.env.VIEW_SYNC_INTERVAL_HOURS || '12'} hours`,
      enabled: process.env.VIEW_TRACKING_REDIS_ENABLED === 'true',
      dedupTTL: `${process.env.VIEW_DEDUP_TTL_HOURS || '24'} hours`,
    });
  } catch (error) {
    logger.error('Failed to get cron job info:', error);
    return NextResponse.json(
      { error: 'Failed to get job info' },
      { status: 500 }
    );
  }
}
