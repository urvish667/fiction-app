import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { prisma } from "@/lib/auth/db-adapter";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { countWords } from "@/lib/utils";
import { S3Service } from "@/lib/s3-service";
import { calculateStoryStatus, isStoryPublic } from "@/lib/story-helpers";

// Validation schema for creating a chapter
const createChapterSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters"),
  content: z.string().default(""), // Allow empty content for new chapters
  number: z.number().int().positive("Chapter number must be positive"),
  isPremium: z.boolean().default(false),
  isDraft: z.boolean().default(true),
  publishDate: z.date().optional(),
});

// GET endpoint to retrieve all chapters for a story
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;
    const session = await getServerSession(authOptions);

    // Find the story to check permissions
    const story = await prisma.story.findUnique({
      where: { id: storyId },
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
      select: { isDraft: true }
    });

    // Calculate story status
    const storyStatus = calculateStoryStatus(storyChapters as any);

    // Check if the story is a draft and the user is not the author
    if (storyStatus === "draft" && (!session?.user?.id || session.user.id !== story.authorId)) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all chapters for the story
    const chapters = await prisma.chapter.findMany({
      where: { storyId },
      orderBy: { number: "asc" },
      select: {
        id: true,
        title: true,
        number: true,
        wordCount: true,
        isPremium: true,
        isDraft: true, // Add isDraft field
        readCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If user is logged in, get their reading progress for each chapter
    let chaptersWithProgress = chapters;

    if (session?.user?.id) {
      const readingProgresses = await prisma.readingProgress.findMany({
        where: {
          userId: session.user.id,
          chapter: {
            storyId,
          },
        },
      });

      const progressMap = new Map(
        readingProgresses.map((progress) => [progress.chapterId, progress.progress])
      );

      chaptersWithProgress = chapters.map((chapter) => ({
        ...chapter,
        readingProgress: progressMap.get(chapter.id) || 0,
      }));
    }

    return NextResponse.json(chaptersWithProgress);
  } catch (error) {
    console.error("Error fetching chapters:", error);
    return NextResponse.json(
      { error: "Failed to fetch chapters" },
      { status: 500 }
    );
  }
}

// POST endpoint to create a new chapter
export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const params = await context.params;
  try {
    const storyId = params.id;

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
        { error: "Unauthorized - You can only add chapters to your own stories" },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = createChapterSchema.parse(body);

    // Check if chapter number already exists
    const existingChapter = await prisma.chapter.findUnique({
      where: {
        storyId_number: {
          storyId,
          number: validatedData.number,
        },
      },
    });

    // If the chapter number already exists, find the next available number
    if (existingChapter) {
      // Find the highest chapter number for this story
      const highestChapter = await prisma.chapter.findFirst({
        where: { storyId },
        orderBy: { number: 'desc' },
      });

      // Set the number to one higher than the current highest
      const nextNumber = highestChapter ? highestChapter.number + 1 : 1;

      // Update the validated data with the new number
      validatedData.number = nextNumber;

      // If the title is a default chapter number title, update it too
      if (validatedData.title === `Chapter ${body.number}`) {
        validatedData.title = `Chapter ${nextNumber}`;
      }

      console.log(`Chapter number conflict resolved. Using number ${nextNumber} instead.`);
    }

    // Calculate word count
    const wordCount = countWords(validatedData.content);

    // Generate S3 key for the chapter content
    const contentKey = `stories/${storyId}/chapters/${validatedData.number}.txt`;

    // Upload content to S3
    try {
      await S3Service.uploadContent(contentKey, validatedData.content);
    } catch (s3Error) {
      console.error("S3 upload error:", s3Error);
      return NextResponse.json(
        { error: "Failed to upload chapter content to storage", message: s3Error instanceof Error ? s3Error.message : "Unknown S3 error" },
        { status: 400 }
      );
    }

    // Create the chapter in the database (without content)
    let chapter;
    try {
      chapter = await prisma.chapter.create({
        data: {
          title: validatedData.title,
          number: validatedData.number,
          isPremium: validatedData.isPremium || false,
          isDraft: validatedData.isDraft || true,
          publishDate: validatedData.publishDate,
          wordCount,
          storyId,
          contentKey,
        },
      });
    } catch (error) {
      // If we still get a unique constraint error, try one more time with a guaranteed unique number
      if (error instanceof Error && error.message.includes('Unique constraint failed')) {
        console.log('Still got a unique constraint error, trying with a guaranteed unique number');

        // Find the highest chapter number for this story
        const highestChapter = await prisma.chapter.findFirst({
          where: { storyId },
          orderBy: { number: 'desc' },
        });

        // Set the number to one higher than the current highest
        const nextNumber = (highestChapter ? highestChapter.number : 0) + 1;

        // Update the title if it's a default chapter number title
        let title = validatedData.title;
        if (title === `Chapter ${validatedData.number}`) {
          title = `Chapter ${nextNumber}`;
        }

        // Try creating again with the new number
        chapter = await prisma.chapter.create({
          data: {
            title,
            number: nextNumber,
            isPremium: validatedData.isPremium || false,
            isDraft: validatedData.isDraft || true,
            publishDate: validatedData.publishDate,
            wordCount,
            storyId,
            contentKey: `stories/${storyId}/chapters/${nextNumber}.txt`,
          },
        });

        // Update the content in S3 with the new key
        await S3Service.uploadContent(`stories/${storyId}/chapters/${nextNumber}.txt`, validatedData.content);
      } else {
        // If it's some other error, rethrow it
        throw error;
      }
    }

    // Add the content to the response (but it's not stored in DB)
    const chapterWithContent = {
      ...chapter,
      content: validatedData.content
    };

    // Update story word count
    await prisma.story.update({
      where: { id: storyId },
      data: {
        wordCount: {
          increment: wordCount,
        },
      },
    });

    // Recalculate and update the story status if needed
    // Get all chapters for this story
    const storyChapters = await prisma.chapter.findMany({
      where: { storyId },
      select: { isDraft: true }
    });

    // Calculate the new story status
    const newStoryStatus = calculateStoryStatus(storyChapters as any);

    // Update the story status if it's different from the current status
    if (newStoryStatus !== story.status) {
      await prisma.story.update({
        where: { id: storyId },
        data: { status: newStoryStatus }
      });
    }

    return NextResponse.json(chapterWithContent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error creating chapter:", error);

    // Provide more detailed error message
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to create chapter", message: errorMessage },
      { status: 500 }
    );
  }
}
