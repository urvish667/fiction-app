import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// Cache control constants
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_VALUE = 'public, max-age=300, stale-while-revalidate=60'; // 5 minutes cache, 1 minute stale

// GET: Fetch popular tags (by usage count)
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true, _count: { select: { stories: true } } },
      orderBy: [{ stories: { _count: 'desc' } }, { name: 'asc' }],
      take: 25,
    });

    // Create response with cache headers
    const response = NextResponse.json(tags);
    response.headers.set(CACHE_CONTROL_HEADER, CACHE_VALUE);

    return response;
  } catch (error) {
    // Log the error for server-side debugging
    logger.error('Failed to fetch tags', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({ error: 'Failed to fetch tags.' }, { status: 500 });
  }
}
