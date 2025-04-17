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
 * @param context The context object containing the storyId parameter
 * @returns A JSON response with the recommended stories
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ storyId: string }> | { storyId: string } }
) {
  try {
    // In Next.js 14, params needs to be awaited
    const params = await context.params;
    const storyId = params.storyId;
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
    let recommendations = await prisma.storyRecommendation.findMany(query) as RecommendationWithRelations[];

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
