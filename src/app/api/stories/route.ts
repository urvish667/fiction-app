import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { slugify } from "@/lib/utils";
import { ViewService } from "@/services/view-service";
import { Prisma } from "@prisma/client";
import { logError } from "@/lib/error-logger";
import { sanitizeText } from "@/lib/security/input-validation";

// Validation schema for creating a story
const createStorySchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  coverImage: z.string().optional(),
  genre: z.string().optional(),
  language: z.string().default("en"),
  isMature: z.boolean().default(false),
  status: z.enum(["draft", "ongoing", "completed"]).default("draft"),
  license: z.enum(["ALL_RIGHTS_RESERVED", "CC_BY", "CC_BY_SA", "CC_BY_NC", "CC_BY_ND", "CC_BY_NC_SA", "CC_BY_NC_ND", "CC0"]).default("ALL_RIGHTS_RESERVED"),
});

// Helper function to determine the order by clause based on sort option
function getOrderByFromSortOption(sortBy: string): Prisma.StoryOrderByWithRelationInput {
  switch (sortBy) {
    case 'newest':
      return { createdAt: Prisma.SortOrder.desc };
    case 'popular':
      return { likes: { _count: Prisma.SortOrder.desc } };
    case 'mostRead':
      return { readCount: Prisma.SortOrder.desc };
    default:
      return { createdAt: Prisma.SortOrder.desc };
  }
}

// GET endpoint to retrieve all stories (with filtering and pagination)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
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
    const where: Prisma.StoryWhereInput = {};
    // Initialize AND as an array to fix type issues
    where.AND = [];

    if (genre) {
      // Use case-insensitive matching for genre name
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
      where.AND.push({ authorId });
    }

    // Handle tags parameter - can be a comma-separated list
    if (tags) {
      const tagValues = tags.split(',').map(t => t.trim().toLowerCase());
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
      const sanitizedSearch = search.replace(/[\s&|!:'()]/g, ' ').trim().split(' ').join(' & ');
      where.AND.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { author: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { username: { contains: search, mode: 'insensitive' } }
            ]
          }},
          { genre: { name: { contains: search, mode: 'insensitive' } } },
          { tags: { some: { tag: { name: { contains: search, mode: 'insensitive' } } } } }
        ]
      });
    }

    // Get session to check if user is requesting their own drafts
    const session = await getServerSession(authOptions);

    // Only show non-draft stories unless user is requesting their own
    if (!session?.user?.id || (authorId !== session.user.id)) {
      // Use AND condition to combine with existing status filter if it exists
      if (where.status) {
        // Check if status is an object with 'in' property
        const statusObj = where.status as Prisma.StringFilter;
        if (statusObj.in) {
          where.status = {
            in: statusObj.in.filter((s: string) => s !== 'draft')
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



    // Get combined view counts (story + chapter views) for these stories
    const storyIds = stories.map(story => story.id);
    const viewCountMap = await ViewService.getBatchCombinedViewCounts(storyIds);

    // Transform stories to include counts and format tags
    const formattedStories = stories.map((story) => {
      // Extract tags safely - return as objects with id and name for consistency
      const tags = Array.isArray(story.tags)
        ? story.tags.map(storyTag => ({
            id: storyTag.tag?.id || '',
            name: storyTag.tag?.name || ''
          })).filter(tag => tag.name)
        : [];

      // Get combined view count
      const viewCount = viewCountMap.get(story.id) || 0;

      return {
        ...story,
        tags,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        bookmarkCount: story._count.bookmarks,
        chapterCount: story._count.chapters,
        viewCount, // Add combined view count
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
    logError(error, { context: 'Fetching stories' });
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

    let validatedData;
    try {
      validatedData = createStorySchema.parse(body);

      // Sanitize user input fields
      validatedData.title = sanitizeText(validatedData.title);
      if (validatedData.description) {
        validatedData.description = sanitizeText(validatedData.description);
      }
    } catch (validationError) {
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

    // Extract genre and language from validated data
    const { genre, language, ...otherData } = validatedData;

    // Prepare data for Prisma with proper relation handling
    const createData: Prisma.StoryCreateInput = {
      ...otherData,
      slug,
      author: { connect: { id: session.user.id } },
    };

    // Handle genre relation if provided - use genreId field directly
    if (genre) {
      createData.genre = { connect: { id: genre } };
    }

    // Handle language relation if provided - use languageId field directly
    if (language) {

      // Check if language is a name (like "English") or an ID
      if (language.length > 20 && language.startsWith('c')) {
        // Looks like an ID, use directly
        createData.language = { connect: { id: language } };
      } else {
        // Looks like a name, try to find the language by name
        try {
          // We'll add this in a try/catch to avoid breaking if language lookup fails
          // The story will be created without a language in that case
          const languageObj = await prisma.language.findFirst({
            where: { name: { equals: language, mode: 'insensitive' } }
          });

          if (languageObj) {
            createData.language = { connect: { id: languageObj.id } };
          } else {
            logError(`Language not found by name: ${language}`);
          }
        } catch (langError) {
          logError(langError, { context: 'Looking up language by name', language });
        }
      }
    }

    // Create the story
    const story = await prisma.story.create({
      data: createData,
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

    // Provide more detailed error message
    let errorMessage = "Unknown error";
    let errorDetails = null;

    if (error instanceof Error) {
      errorMessage = error.message;

      // Check if it's a Prisma error with more details
      if (error.name === 'PrismaClientValidationError' ||
          error.name === 'PrismaClientKnownRequestError') {
        // Log the full error for debugging
        logError(error, {
          context: 'Creating story',
          errorType: error.name,
          details: JSON.stringify(error, null, 2)
        });

        // Extract useful information from the error
        if (error.message.includes('Unknown argument')) {
          errorDetails = 'Invalid field in story data. Check the logs for details.';
        } else if (error.message.includes('Foreign key constraint failed')) {
          errorDetails = 'Referenced record (like genre or language) does not exist.';
        }
      } else {
        // Log other errors
        logError(error, { context: 'Creating story' });
      }
    } else {
      // Log non-Error objects
      logError(String(error), { context: 'Creating story', errorType: typeof error });
    }

    return NextResponse.json(
      {
        error: "Failed to create story",
        message: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}
