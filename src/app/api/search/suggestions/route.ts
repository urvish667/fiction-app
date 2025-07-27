import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ message: 'Query parameter "q" is required' }, { status: 400 });
  }

  try {
    const genres = await prisma.genre.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 3,
    });

    const tags = await prisma.tag.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 3,
    });

    const stories = await prisma.story.findMany({
      where: {
        title: {
          contains: query,
          mode: 'insensitive',
        },
      },
      take: 3,
    });

    return NextResponse.json({ genres, tags, stories });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ message: 'Error fetching suggestions' }, { status: 500 });
  }
}
