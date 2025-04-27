import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Cache control constants
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_VALUE = 'public, max-age=60, stale-while-revalidate=30'; // 1 minute cache, 30 seconds stale

// Input validation schema
const searchParamsSchema = z.object({
  q: z.string().trim().min(1).optional(),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Validate input
    const result = searchParamsSchema.safeParse({ q: searchParams.get("q") });
    if (!result.success) {
      return NextResponse.json([], { status: 200 });
    }

    const q = result.data.q?.toLowerCase() || "";

    if (!q || q.length < 1) {
      return NextResponse.json([], { status: 200 });
    }

    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: q,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        name: true,
        _count: { select: { stories: true } },
      },
      orderBy: [
        { stories: { _count: "desc" } },
        { name: "asc" },
      ],
      take: 20,
    });

    // Create response with cache headers
    const response = NextResponse.json(tags);
    response.headers.set(CACHE_CONTROL_HEADER, CACHE_VALUE);

    return response;
  } catch (error) {
    // Log the error for server-side debugging
    logger.error('Failed to search tags', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: 'Failed to search tags.' },
      { status: 500 }
    );
  }
}
