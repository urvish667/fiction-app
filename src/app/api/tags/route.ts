import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch popular tags (by usage count)
export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      select: { id: true, name: true, _count: { select: { stories: true } } },
      orderBy: [{ stories: { _count: 'desc' } }, { name: 'asc' }],
      take: 25,
    });
    return NextResponse.json(tags);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch tags.' }, { status: 500 });
  }
}
