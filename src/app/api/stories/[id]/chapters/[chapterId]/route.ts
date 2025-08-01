import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { countWords } from "@/lib/utils";
import { AzureService } from "@/lib/azure-service";
import { calculateStoryStatus } from "@/lib/story-helpers";
import { ViewService } from "@/services/view-service";
import { Chapter } from "@/types/story";
import { Prisma } from "@prisma/client";
import { logError } from "@/lib/error-logger";
import { sanitizeHtml } from "@/lib/security/input-validation";
// Temporarily commented out for performance improvement
// import { queueFollowerNotificationsAboutNewChapter } from "@/lib/chapter-notification-service";

// Define the params type for route handlers
type ChapterRouteParams = { params: Promise<{ id: string; chapterId: string }> };

// Validation schema for updating a chapter
const updateChapterSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters").optional(),
  content: z.string().min(1, "Content is required").optional(),
  number: z.number().int().positive("Chapter number must be positive").optional(),
  isPremium: z.boolean().optional(),
  status: z.enum(['draft', 'scheduled', 'published']).optional(),
  publishDate: z.union([
    z.string().transform((str) => new Date(str)),
    z.date(),
    z.null()
  ]).optional(),
  notifyFollowers: z.boolean().optional(),
});

// GET endpoint to retrieve a specific chapter
export async function GET(
  request: NextRequest,
  { params }: ChapterRouteParams
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;
    const chapterId = resolvedParams.chapterId;
    const session = await getServerSession(authOptions);

    // Find the story to check permissions
    const story = await prisma.story.findUnique({
      where: { id: storyId },
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

    if (!story) {
      return NextResponse.json(
        { error: "Story not found" },
        { status: 404 }
      );
    }

    // Get chapters to determine story status
    const storyChapters = await prisma.chapter.findMany({
      where: { storyId: story.id },
      select: { status: true }
    });

    // Calculate story status
    const storyStatus = calculateStoryStatus(storyChapters as unknown as Chapter[]);

    // Check if the story is a draft and the user is not the author
    if (storyStatus === "draft" && (!session?.user?.id || session.user.id !== story.authorId)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Check if the chapter is premium and the user is not the author
    if (chapter.isPremium && (!session?.user?.id || session.user.id !== story.authorId)) {
      // TODO: Implement premium access check
      // For now, just return a basic version without content
      return NextResponse.json({
        ...chapter,
        content: "This is premium content. Please upgrade to access.",
        isPremium: true,
      });
    }

    // Get user's reading progress if logged in
    let readingProgress = null;
    let chapterViewCount = undefined;
    let storyViewCount = undefined;

    if (session?.user?.id && session.user.id !== story.authorId) {
      readingProgress = await prisma.readingProgress.findUnique({
        where: {
          userId_chapterId: {
            userId: session.user.id,
            chapterId: chapter.id,
          },
        },
      });

      // If no reading progress exists, create one with 0 progress
      if (!readingProgress) {
        readingProgress = await prisma.readingProgress.create({
          data: {
            userId: session.user.id,
            chapterId: chapter.id,
            progress: 0,
          },
        });
      }
    }

    // Track view if not the author
    if (session?.user?.id !== story.authorId) {
      // Get client IP and user agent for anonymous tracking
      const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip');
      const userAgent = request.headers.get('user-agent');

      try {
        // Track the chapter view and automatically track story view using the improved ViewService
        const viewResult = await ViewService.trackChapterView(
          chapter.id,
          session?.user?.id,
          { ip: clientIp || undefined, userAgent: userAgent || undefined },
          true // Also track a view for the story
        );

        // Log if this is a first view (for debugging)
        // if (viewResult?.isFirstView) {
        //   console.log(`First view recorded for chapter ${chapter.id} by user ${session?.user?.id || 'anonymous'}`);
        // }

        // Add view counts to the response
        if (viewResult?.chapterViewCount !== undefined) {
          chapterViewCount = viewResult.chapterViewCount;
        }

        if (viewResult?.storyViewCount !== undefined && story) {
          storyViewCount = viewResult.storyViewCount;
        }
      } catch (viewError) {
        // Log the error but don't fail the request
        logError(viewError, { context: 'Tracking chapter view', chapterId: chapter.id, userId: session?.user?.id });
      }
    }

    // Fetch content from Azure Blob Storage
    let content;
    try {
      content = await AzureService.getContent(chapter.contentKey);
    } catch (error) {
      logError(error, { context: 'Fetching chapter content from storage', chapterId: chapter.id });
      content = "Content could not be loaded.";
    }

    // Return chapter with reading progress and content
    return NextResponse.json({
      ...chapter,
      content,
      viewCount: chapterViewCount,
      story: {
        id: story.id,
        title: story.title,
        slug: story.slug,
        author: story.author,
        viewCount: storyViewCount,
      },
      readingProgress: readingProgress?.progress || 0,
    });
  } catch (error) {
    logError(error, { context: 'Fetching chapter' });
    return NextResponse.json(
      { error: "Failed to fetch chapter" },
      { status: 500 }
    );
  }
}

// PUT endpoint to update a chapter
export async function PUT(
  request: NextRequest,
  { params }: ChapterRouteParams
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;
    const chapterId = resolvedParams.chapterId;

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
        { error: "Unauthorized - You can only edit chapters of your own stories" },
        { status: 403 }
      );
    }

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = updateChapterSchema.parse(body);

    // Sanitize the content field to prevent XSS attacks
    if (validatedData.content) {
      validatedData.content = sanitizeHtml(validatedData.content);
    }

    // Check if new chapter number already exists (if changing)
    if (validatedData.number && validatedData.number !== chapter.number) {
      const existingChapter = await prisma.chapter.findUnique({
        where: {
          storyId_number: {
            storyId,
            number: validatedData.number,
          },
        },
      });

      if (existingChapter) {
        return NextResponse.json(
          { error: `Chapter ${validatedData.number} already exists` },
          { status: 400 }
        );
      }
    }

    // Calculate word count if content is updated
    let wordCountDiff = 0;
    let dataToUpdate: Prisma.ChapterUpdateInput = { ...validatedData };

    if (validatedData.content) {
      const newWordCount = countWords(validatedData.content);
      wordCountDiff = newWordCount - chapter.wordCount;

      // Update content in Azure Blob Storage
      await AzureService.uploadContent(chapter.contentKey, validatedData.content);

      // Remove content from data as it's not stored in DB
      delete (validatedData as { content?: string }).content;
      dataToUpdate = {
        ...validatedData,
        wordCount: newWordCount,
      };
    }

    // Update the chapter in the database
    const updatedChapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: dataToUpdate,
    });

    // Add content to the response
    let responseContent;
    try {
      // Use the original content from validatedData if it exists
      responseContent = validatedData.content || await AzureService.getContent(chapter.contentKey);
    } catch (error) {
      logError(error, { context: 'Fetching chapter content from storage', chapterId: chapter.id });
      responseContent = "Content could not be loaded.";
    }

    const chapterWithContent = {
      ...updatedChapter,
      content: responseContent
    };

    // Update story word count if needed
    if (wordCountDiff !== 0) {
      await prisma.story.update({
        where: { id: storyId },
        data: {
          wordCount: {
            increment: wordCountDiff,
          },
        },
      });
    }

    // If the chapter's status has changed, recalculate and update the story status
    if (validatedData.status !== undefined) {
      // Get all chapters for this story
      const storyChapters = await prisma.chapter.findMany({
        where: { storyId },
        select: {
          status: true
        }
      });

      // Calculate the new story status
      const newStoryStatus = calculateStoryStatus(storyChapters as unknown as Chapter[]);

      // Update the story status if it's different from the current status
      if (newStoryStatus !== story.status) {
        await prisma.story.update({
          where: { id: storyId },
          data: { status: newStoryStatus }
        });
      }

      // If the chapter is being published, queue notifications to followers
      // Temporarily commented out to improve performance
      /*
      if (validatedData.status === 'published' && chapter.status !== 'published') {
        // Queue notifications to followers (async operation)
        await queueFollowerNotificationsAboutNewChapter(
          storyId,
          chapterId,
          session.user.id,
          validatedData.notifyFollowers !== false // Default to true if not specified
        );
      }
      */
    }

    return NextResponse.json(chapterWithContent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    logError(error, { context: 'Updating chapter' });
    return NextResponse.json(
      { error: "Failed to update chapter" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a chapter
export async function DELETE(
  _request: NextRequest,
  { params }: ChapterRouteParams
) {
  try {
    const resolvedParams = await params;
    const storyId = resolvedParams.id;
    const chapterId = resolvedParams.chapterId;

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
        { error: "Unauthorized - You can only delete chapters of your own stories" },
        { status: 403 }
      );
    }

    // Prevent deleting chapters from a completed story
    if (story.status === 'completed') {
      return NextResponse.json(
        { error: "Cannot delete chapters from a completed story. Please change the story status to 'ongoing' first." },
        { status: 403 }
      );
    }

    // Find the chapter
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: chapterId,
        storyId,
      },
    });

    if (!chapter) {
      return NextResponse.json(
        { error: "Chapter not found" },
        { status: 404 }
      );
    }

    // Delete content from Azure Blob Storage
    try {
      await AzureService.deleteContent(chapter.contentKey);
    } catch (error) {
      logError(error, { context: 'Deleting chapter content from storage', chapterId: chapter.id });
      // Continue with chapter deletion even if Azure Blob Storage deletion fails
    }

    // Delete the chapter from database
    await prisma.chapter.delete({
      where: { id: chapterId },
    });

    // Update story word count
    await prisma.story.update({
      where: { id: storyId },
      data: {
        wordCount: {
          decrement: chapter.wordCount,
        },
      },
    });

    // Recalculate and update the story status after chapter deletion
    const remainingChapters = await prisma.chapter.findMany({
      where: { storyId },
      select: { status: true }
    });

    // Calculate the new story status
    const newStoryStatus = calculateStoryStatus(remainingChapters as unknown as Chapter[]);

    // Update the story status if it's different from the current status
    if (newStoryStatus !== story.status) {
      await prisma.story.update({
        where: { id: storyId },
        data: { status: newStoryStatus }
      });
    }

    return NextResponse.json(
      { message: "Chapter deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    logError(error, { context: 'Deleting chapter' });
    return NextResponse.json(
      { error: "Failed to delete chapter" },
      { status: 500 }
    );
  }
}
