import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { Prisma } from "@prisma/client";

// Define the type for the recommendation with included relations
type RecommendationWithRelations = Prisma.StoryRecommendationGetPayload<{
  include: {
    recommendedStory: {
      include: {
        author: {
          select: {
            id: boolean;
            name: boolean;
            username: boolean;
            image: boolean;
          };
        };
        genre: boolean;
        tags: {
          include: {
            tag: boolean;
          };
        };
        _count: {
          select: {
            likes: boolean;
            comments: boolean;
            bookmarks: boolean;
            chapters: boolean;
          };
        };
      };
    };
  };
}>;

/**
 * GET endpoint to retrieve recommendations for a story
 *
 * @param request The request object
 * @param params The params object containing the storyId parameter
 * @returns A JSON response with the recommended stories
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.storyId;
    const { searchParams } = new URL(request.url);

    // Optional parameters
    const limit = parseInt(searchParams.get("limit") || "5", 10);
    const excludeSameAuthor = searchParams.get("excludeSameAuthor") === "true";

    // Validate storyId
    if (!storyId) {
      return NextResponse.json(
        { error: "Story ID is required" },
        { status: 400 }
      );
    }

    // Check if the story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      select: { id: true, authorId: true },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Build the query for recommendations
    const query: any = {
      where: {
        storyId: storyId,
      },
      orderBy: {
        score: "desc",
      },
      take: limit,
      include: {
        recommendedStory: {
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
            tags: {
              include: {
                tag: true,
              },
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
        },
      },
    };

    // Get recommendations
    console.log(`Fetching recommendations for story ID: ${storyId}`);

    // First check if any recommendations exist for this story (without all the includes)
    const recommendationCount = await prisma.storyRecommendation.count({
      where: { storyId: storyId }
    });

    console.log(`Found ${recommendationCount} raw recommendations for story ${storyId}`);

    // If no recommendations exist at all, return early
    if (recommendationCount === 0) {
      console.log(`No recommendations found in database for story ${storyId}`);
      return NextResponse.json([]);
    }

    // Get recommendations with all the includes
    let recommendations = await prisma.storyRecommendation.findMany(query) as RecommendationWithRelations[];
    console.log(`Found ${recommendations.length} recommendations with includes for story ${storyId}`);

    // If no recommendations found after includes, return empty array
    if (recommendations.length === 0) {
      console.log(`No recommendations found after applying includes for story ${storyId}`);
      return NextResponse.json([]);
    }

    // If excludeSameAuthor is true, filter out stories by the same author
    if (excludeSameAuthor) {
      recommendations = recommendations.filter(
        (rec) => {
          // Make sure recommendedStory exists and has authorId
          if (!rec.recommendedStory || typeof rec.recommendedStory !== 'object') {
            return true; // Keep the recommendation if we can't determine the author
          }
          return rec.recommendedStory.authorId !== story.authorId;
        }
      );
    }

    // Format the response
    const formattedRecommendations = recommendations.map((rec) => {
      const { recommendedStory, score } = rec;

      return {
        id: recommendedStory.id,
        title: recommendedStory.title,
        slug: recommendedStory.slug,
        description: recommendedStory.description,
        coverImage: recommendedStory.coverImage,
        status: recommendedStory.status,
        author: recommendedStory.author,
        genre: recommendedStory.genre?.name || null,
        tags: recommendedStory.tags.map((t: { tag: { name: string } }) => t.tag.name),
        likeCount: recommendedStory._count.likes,
        commentCount: recommendedStory._count.comments,
        bookmarkCount: recommendedStory._count.bookmarks,
        chapterCount: recommendedStory._count.chapters,
        similarityScore: score,
      };
    });

    return NextResponse.json(formattedRecommendations);
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return NextResponse.json(
      { error: "Failed to fetch recommendations" },
      { status: 500 }
    );
  }
}
