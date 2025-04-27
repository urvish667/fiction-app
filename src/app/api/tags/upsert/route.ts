import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// Input validation schema
const upsertTagsSchema = z.object({
  storyId: z.string().min(1, "Story ID is required"),
  tags: z.array(z.string()).min(3, "At least 3 tags are required").max(10, "Maximum 10 tags allowed"),
});

// POST: Upsert tags for a story
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const result = upsertTagsSchema.safeParse(body);
    if (!result.success) {
      logger.warn('Invalid tag upsert request', {
        errors: result.error.format(),
        body
      });
      return NextResponse.json({
        error: 'Invalid request data',
        details: result.error.format()
      }, { status: 400 });
    }

    const { storyId, tags } = result.data;

    // Normalize tags: trim, lowercase, dedupe, filter empty
    const normalized = Array.from(
      new Set(
        tags.map((t: string) => t.trim().toLowerCase()).filter((t: string) => t)
      )
    );

    if (normalized.length < 3 || normalized.length > 10) {
      return NextResponse.json({ error: 'Must provide 3-10 unique tags.' }, { status: 400 });
    }

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true }
    });

    if (!story) {
      logger.warn('Attempted to add tags to non-existent story', { storyId });
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    // Upsert tags
    const tagRecords = await Promise.all(
      normalized.map(async (name) =>
        prisma.tag.upsert({ where: { name }, update: {}, create: { name } })
      )
    );

    // Remove old tags for this story
    await prisma.storyTag.deleteMany({ where: { storyId } });

    // Create new relations
    await prisma.storyTag.createMany({
      data: tagRecords.map((tag) => ({ storyId, tagId: tag.id })),
      skipDuplicates: true,
    });

    logger.info('Tags updated successfully', {
      storyId,
      tagCount: normalized.length
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the error for server-side debugging
    logger.error('Failed to upsert tags', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json({ error: 'Failed to upsert tags.' }, { status: 500 });
  }
}
