import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Cache control constants
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_VALUE = 'public, s-maxage=60, stale-while-revalidate=30';

/**
 * GET endpoint to retrieve all languages
 * Languages are static reference data that rarely changes
 */
export async function GET() {
  try {
    const languages = await prisma.language.findMany({ orderBy: { name: 'asc' } });

    // Create response with cache headers
    const response = NextResponse.json(languages);
    response.headers.set(CACHE_CONTROL_HEADER, CACHE_VALUE);

    return response;
  } catch (error) {
    // Log the error for server-side debugging
    logger.error('Failed to fetch languages', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Failed to fetch languages.' },
      { status: 500 }
    );
  }
}
