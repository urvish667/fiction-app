import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Cache control constants
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_VALUE = 'public, s-maxage=60, stale-while-revalidate=30';

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({ orderBy: { name: 'asc' } });

    // Create response with cache headers
    const response = NextResponse.json(genres);
    response.headers.set(CACHE_CONTROL_HEADER, CACHE_VALUE);

    return response;
  } catch (error) {
    // Log the error for server-side debugging
    logger.error('Failed to fetch genres', { error: error instanceof Error ? error.message : String(error) });

    return NextResponse.json(
      { error: 'Failed to fetch genres.' },
      { status: 500 }
    );
  }
}
