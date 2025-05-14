import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { slugify } from "@/lib/utils";
import { calculateStoryStatus } from "@/lib/story-helpers";
import { ViewService } from "@/services/view-service";
import { Chapter } from "@/types/story";
import { Prisma } from "@prisma/client";

// Validation schema for updating a story
const updateStorySchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters").optional(),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  coverImage: z.string().optional().nullable(),
  genre: z.string().optional().nullable(),
  language: z.string().optional(),
  isMature: z.boolean().optional(),
  status: z.enum(["draft", "ongoing", "completed"]).optional(),
});



// GET endpoint to retrieve a specific story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;
    const session = await getServerSession(authOptions);

    // Find the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            donationsEnabled: true,
            donationMethod: true,
            donationLink: true,
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
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Get chapters to determine story status
    const chapters = await prisma.chapter.findMany({
      where: { storyId: story.id },
      select: {
        status: true
      }
    });

    // Calculate story status
    const storyStatus = calculateStoryStatus(chapters as unknown as Chapter[]);

    // Check if the story is a draft and the user is not the author
    if (storyStatus === "draft" && (!session?.user?.id || session.user.id !== story.authorId)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the user has liked or bookmarked the story
    let isLiked = false;
    let isBookmarked = false;

    if (session?.user?.id) {
      const [like, bookmark] = await Promise.all([
        prisma.like.findFirst({
          where: {
            userId: session.user.id,
            storyId: story.id,
            chapterId: null,
          },
        }),
        prisma.bookmark.findUnique({
          where: {
            userId_storyId: {
              userId: session.user.id,
              storyId: story.id,
            },
          },
        }),
      ]);

      isLiked = !!like;
      isBookmarked = !!bookmark;
    }

    // Get the combined view count before formatting the response
    let viewCount = 0;
    try {
      viewCount = await ViewService.getCombinedViewCount(story.id);
    } catch (viewCountError) {
      console.error("Error getting combined view count:", viewCountError);
    }

    // Format the response
    const formattedStory = {
      ...story,
      author: story.author,
      // Extract tags safely
      tags: Array.isArray(story.tags)
        ? story.tags.map(storyTag => storyTag.tag?.name || '').filter(Boolean)
        : [],
      likeCount: story._count.likes,
      commentCount: story._count.comments,
      bookmarkCount: story._count.bookmarks,
      chapterCount: story._count.chapters,
      isLiked,
      isBookmarked,
      _count: undefined,
      viewCount, // Set the view count from the combined count
    };

    // Track view if not the author
    if (session?.user?.id !== story.authorId) {
      // Get client IP and user agent for anonymous tracking
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      const userAgent = request.headers.get('user-agent');

      try {
        // Track the view using the improved ViewService
        const viewResult = await ViewService.trackStoryView(
          story.id,
          session?.user?.id,
          { ip: clientIp || undefined, userAgent: userAgent || undefined }
        );



        // Update the view count in the response if available
        if (viewResult?.viewCount !== undefined) {
          formattedStory.viewCount = viewResult.viewCount;
        }
      } catch (viewError) {
        // Log the error but don't fail the request
        console.error("Error tracking story view:", viewError);
      }
    }

    return NextResponse.json(formattedStory);
  } catch (error) {
    console.error("Error fetching story:", error);
    return NextResponse.json(
      { error: "Failed to fetch story" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a story
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Check if the user is the author
    if (story.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only edit your own stories" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();

    let validatedData;
    try {
      // If the genre is an object, extract the ID before validation
      if (body.genre && typeof body.genre === 'object' && body.genre.id) {
        body.genre = body.genre.id;
      }

      validatedData = updateStorySchema.parse(body);
    } catch (validationError) {
      return NextResponse.json(
        { error: "Validation error", details: (validationError as z.ZodError).errors },
        { status: 400 }
      );
    }

    // Update slug if title is changed
    let slug = story.slug;
    if (validatedData.title) {
      const baseSlug = slugify(validatedData.title);
      slug = baseSlug;

      // Check if the new slug already exists (and is not this story)
      const existingStory = await prisma.story.findFirst({
        where: {
          slug,
          id: { not: storyId },
        },
      });

      if (existingStory) {
        let counter = 1;
        while (true) {
          const newSlug = `${baseSlug}-${counter}`;
          const exists = await prisma.story.findFirst({
            where: {
              slug: newSlug,
              id: { not: storyId },
            },
          });

          if (!exists) {
            slug = newSlug;
            break;
          }

          counter++;
        }
      }
    }

    // Prepare data for update
    // Handle genre and language as relations if they are provided as IDs
    const { genre, language, ...otherData } = validatedData;

    // Prepare the data object for Prisma
    const updateData: Prisma.StoryUpdateInput = {
      ...otherData,
      slug,
    };

    // Handle genre relation if provided
    if (genre !== undefined) {
      if (genre === null) {
        // If genre is null, disconnect the relation
        updateData.genre = { disconnect: true };
      } else {
        // If genre is a string ID, connect to that genre
        updateData.genre = { connect: { id: genre } };
      }
    }

    // Handle language relation if provided
    if (language !== undefined) {
      if (language === null) {
        // If language is null, disconnect the relation
        updateData.language = { disconnect: true };
      } else {
        // If language is a string ID, connect to that language
        updateData.language = { connect: { id: language } };
      }
    }

    // Update the story
    const updatedStory = await prisma.story.update({
      where: { id: storyId },
      data: updateData,
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

    return NextResponse.json(updatedStory);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error updating story:", error);
    return NextResponse.json(
      { error: "Failed to update story" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a story
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the story
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Check if the user is the author
    if (story.authorId !== session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized - You can only delete your own stories" },
        { status: 403 }
      );
    }

    // Delete the story (this will cascade delete chapters, comments, likes, etc.)
    await prisma.story.delete({
      where: { id: storyId },
    });

    return NextResponse.json(
      { message: "Story deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting story:", error);
    return NextResponse.json(
      { error: "Failed to delete story" },
      { status: 500 }
    );
  }
}
