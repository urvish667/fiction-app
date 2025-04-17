import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { slugify } from "@/lib/utils";
import { calculateStoryStatus, isStoryPublic } from "@/lib/story-helpers";

// Validation schema for creating a story
const createStorySchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  coverImage: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().default("en"),
  isMature: z.boolean().default(false),
  status: z.enum(["draft", "ongoing", "completed"]).default("draft"),
});

// Helper function to determine the order by clause based on sort option
function getOrderByFromSortOption(sortBy: string) {
  switch (sortBy) {
    case 'newest':
      return { createdAt: 'desc' };
    case 'popular':
      return { likes: { _count: 'desc' } };
    case 'mostRead':
      return { readCount: 'desc' };
    default:
      return { createdAt: 'desc' };
  }
}

// GET endpoint to retrieve all stories (with filtering and pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const genre = searchParams.get("genre");
    const authorId = searchParams.get("authorId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const tags = searchParams.get("tags");
    const language = searchParams.get("language");
    const sortBy = searchParams.get("sortBy") || "newest";

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Build filter conditions
    const where: any = {};

    if (genre) {
      // Use case-insensitive matching for genre name
      where.AND = where.AND || [];
      where.AND.push({
        genre: {
          name: {
            equals: genre,
            mode: 'insensitive'
          }
        }
      });
    }
    if (language) {
      // Use case-insensitive matching for language name
      where.AND = where.AND || [];
      where.AND.push({
        language: {
          name: {
            equals: language,
            mode: 'insensitive'
          }
        }
      });
    }
    if (authorId) {
      where.AND = where.AND || [];
      where.AND.push({ authorId });
    }

    // Handle tags parameter - can be a comma-separated list
    if (tags) {
      const tagValues = tags.split(',').map(t => t.trim().toLowerCase());
      where.AND = where.AND || [];
      where.AND.push({
        tags: {
          some: {
            tag: {
              name: {
                in: tagValues
              }
            }
          }
        }
      });
    }

    // Handle status parameter - can be a comma-separated list
    if (status) {
      where.AND = where.AND || [];

      if (status.includes(',')) {
        // If comma-separated, use 'in' operator
        const statusValues = status.split(',').map(s => s.trim());
        where.AND.push({ status: { in: statusValues } });
      } else if (status === "all") {
        // If 'all', include both 'ongoing' and 'completed'
        where.AND.push({ status: { in: ["ongoing", "completed"] } });
      } else {
        // Single status value
        where.AND.push({ status });
      }
    }

    if (search) {
      where.OR = [
        // Search in story title and description
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },

        // Search by author name or username
        { author: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } }
          ]
        }},

        // Search by genre name
        { genre: { name: { contains: search, mode: 'insensitive' } } },

        // Search by tag name
        { tags: { some: { tag: { name: { contains: search, mode: 'insensitive' } } } } }
      ];
    }

    // Get session to check if user is requesting their own drafts
    const session = await getServerSession(authOptions);

    // Only show non-draft stories unless user is requesting their own
    if (!session?.user?.id || (authorId !== session.user.id)) {
      // Use AND condition to combine with existing status filter if it exists
      if (where.status) {
        // If status is already an object with 'in' property, modify it to exclude 'draft'
        if (where.status.in) {
          where.status = {
            in: where.status.in.filter((s: string) => s !== 'draft')
          };
        }
        // If status is a simple string, convert to an object
        else if (typeof where.status === 'string') {
          const currentStatus = where.status;
          where.status = {
            equals: currentStatus,
            not: 'draft'
          };
        }
      } else {
        // If no status filter yet, just exclude drafts
        where.AND = where.AND || [];
        where.AND.push({ status: { not: "draft" } });
      }
    }

    // Execute query with count
    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
          genre: true,
          language: true,
          tags: {
            include: {
              tag: true
            }
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              bookmarks: true,
              chapters: true,
            },
          },
        },
        orderBy: getOrderByFromSortOption(sortBy),
        skip,
        take: limit,
      }),
      prisma.story.count({ where }),
    ]);



    // Transform stories to include counts and format tags
    const formattedStories = stories.map((story) => {
      // Extract tags safely
      const tags = Array.isArray(story.tags)
        ? story.tags.map(storyTag => storyTag.tag?.name || '').filter(Boolean)
        : [];

      return {
        ...story,
        tags,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        bookmarkCount: story._count.bookmarks,
        chapterCount: story._count.chapters,
        _count: undefined,
      };
    });

    // Add pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasMore = page < totalPages;



    return NextResponse.json({
      stories: formattedStories,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasMore,
      },
    });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return NextResponse.json(
      { error: "Failed to fetch stories" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new story
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    console.log('Create story request body:', body);

    let validatedData;
    try {
      validatedData = createStorySchema.parse(body);
      console.log('Validated data:', validatedData);
    } catch (validationError) {
      console.error('Validation error:', validationError);
      throw validationError;
    }

    // Generate a unique slug from the title
    const baseSlug = slugify(validatedData.title);
    let slug = baseSlug;
    let slugExists = true;
    let counter = 1;

    // Keep checking until we find a unique slug
    while (slugExists) {
      const existingStory = await prisma.story.findUnique({
        where: { slug },
      });

      if (!existingStory) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    // Create the story
    const story = await prisma.story.create({
      data: {
        ...validatedData,
        slug,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(story, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating story:", error);
    return NextResponse.json(
      { error: "Failed to create story" },
      { status: 500 }
    );
  }
}
