/**
 * Server-side data fetching utilities for browse page
 * This enables SSR for better SEO and Google indexing
 */

import { prisma } from "@/lib/auth/db-adapter";
import { Prisma } from "@prisma/client";

export interface BrowseParams {
  genre?: string;
  tag?: string;
  tags?: string;
  search?: string;
  page?: string;
  sortBy?: string;
  status?: string;
  language?: string;
}

export interface BrowseStory {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverImage: string | null;
  status: string;
  isMature: boolean;
  createdAt: Date;
  updatedAt: Date;
  likeCount: number;
  commentCount: number;
  viewCount: number;
  wordCount: number;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  genre: {
    id: string;
    name: string;
    slug: string | null;
  } | null;
  language: {
    id: string;
    name: string;
  } | null;
  tags: Array<{
    tag: {
      id: string;
      name: string;
      slug: string | null;
    };
  }>;
}

export interface BrowseResult {
  stories: BrowseStory[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Get order by clause based on sort option
 */
function getOrderByFromSortOption(sortBy: string): Prisma.StoryOrderByWithRelationInput {
  switch (sortBy) {
    case 'newest':
      return { updatedAt: Prisma.SortOrder.desc };
    case 'popular':
      return { likes: { _count: Prisma.SortOrder.desc } };
    case 'mostRead':
      return { readCount: Prisma.SortOrder.desc };
    default:
      return { createdAt: Prisma.SortOrder.desc };
  }
}

/**
 * Fetch stories from database with filters (server-side only)
 * This function should only be called from Server Components
 */
export async function fetchBrowseStories(params: BrowseParams): Promise<BrowseResult> {
  const page = parseInt(params.page || "1");
  const limit = 16; // Match client-side storiesPerPage
  const skip = (page - 1) * limit;

  // Build filter conditions
  const where: Prisma.StoryWhereInput = {};
  where.AND = [];

  // Genre filter
  if (params.genre) {
    where.AND.push({
      genre: {
        slug: {
          equals: params.genre,
          mode: 'insensitive'
        }
      }
    });
  }

  // Language filter
  if (params.language) {
    where.AND.push({
      language: {
        name: {
          equals: params.language,
          mode: 'insensitive'
        }
      }
    });
  }

  // Tags filter - handle both single tag and multiple tags
  const tagsToFilter = params.tag ? [params.tag] : (params.tags ? params.tags.split(',').map(t => t.trim()) : []);
  if (tagsToFilter.length > 0) {
    where.AND.push({
      tags: {
        some: {
          tag: {
            slug: {
              in: tagsToFilter
            }
          }
        }
      }
    });
  }

  // Status filter
  const status = params.status || "all";
  if (status === "all") {
    where.AND.push({ status: { in: ["ongoing", "completed"] } });
  } else if (status === "ongoing" || status === "completed") {
    where.AND.push({ status });
  } else {
    // Default to showing published stories
    where.AND.push({ status: { in: ["ongoing", "completed"] } });
  }

  // Search filter
  if (params.search) {
    where.AND.push({
      OR: [
        { title: { contains: params.search, mode: 'insensitive' } },
        { description: { contains: params.search, mode: 'insensitive' } },
        { author: {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' } },
            { username: { contains: params.search, mode: 'insensitive' } }
          ]
        }},
        { genre: { name: { contains: params.search, mode: 'insensitive' } } },
        { tags: { some: { tag: { name: { contains: params.search, mode: 'insensitive' } } } } }
      ]
    });
  }

  // Get sort order
  const orderBy = getOrderByFromSortOption(params.sortBy || "newest");

  try {
    // Fetch stories and total count in parallel
    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          status: true,
          isMature: true,
          createdAt: true,
          updatedAt: true,
          wordCount: true,
          readCount: true,
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            }
          },
          genre: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          },
          language: {
            select: {
              id: true,
              name: true,
            }
          },
          tags: {
            select: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                }
              }
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
            }
          }
        }
      }),
      prisma.story.count({ where })
    ]);

    // Transform stories to match expected format
    const transformedStories: BrowseStory[] = stories.map(story => ({
      id: story.id,
      title: story.title,
      slug: story.slug,
      description: story.description,
      coverImage: story.coverImage,
      status: story.status,
      isMature: story.isMature,
      createdAt: story.createdAt,
      updatedAt: story.updatedAt,
      likeCount: story._count.likes,
      commentCount: story._count.comments,
      viewCount: story.readCount || 0,
      wordCount: story.wordCount || 0,
      author: story.author,
      genre: story.genre,
      language: story.language,
      tags: story.tags,
    }));

    return {
      stories: transformedStories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    };
  } catch (error) {
    console.error("Error fetching browse stories:", error);
    // Return empty result on error
    return {
      stories: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      }
    };
  }
}
