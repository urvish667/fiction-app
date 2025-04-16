import { NextRequest, NextResponse } from 'next/server';
import { prisma} from '@/lib/prisma';

// POST: Upsert tags for a story
export async function POST(req: NextRequest) {
  try {
    const { storyId, tags } = await req.json();
    if (!storyId || !Array.isArray(tags)) {
      return NextResponse.json({ error: 'Missing storyId or tags.' }, { status: 400 });
    }
    // Normalize tags: trim, lowercase, dedupe, filter empty
    const normalized = Array.from(
      new Set(
        tags.map((t: string) => t.trim().toLowerCase()).filter((t: string) => t)
      )
    );
    if (normalized.length < 3 || normalized.length > 10) {
      return NextResponse.json({ error: 'Must provide 3-10 unique tags.' }, { status: 400 });
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
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to upsert tags.' }, { status: 500 });
  }
}
