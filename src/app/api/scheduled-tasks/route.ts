import { NextRequest, NextResponse } from "next/server";
import { processScheduledChapters } from "@/lib/scheduled-tasks";
import { logger } from "@/lib/logger"; // Using Pino logger instead of console

/**
 * API route to trigger scheduled tasks
 *
 * This endpoint can be called by an external cron job service (like Vercel Cron Jobs)
 * or by a scheduled task runner.
 *
 * It requires an API key for security, which should be set in the environment variables.
 */
export async function POST(request: NextRequest) {
  try {
    // Check for API key authorization
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.SCHEDULED_TASKS_API_KEY;

    if (!apiKey) {
      logger.warn("SCHEDULED_TASKS_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      logger.warn("Unauthorized attempt to access scheduled tasks API");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse request body to determine which tasks to run
    const body = await request.json().catch(() => ({}));
    const tasks = body.tasks || ["all"];

    const results: Record<string, {
      message: string;
      count?: number;
      details?: unknown;
    }> = {};

    // Process scheduled chapters
    if (tasks.includes("all") || tasks.includes("publishScheduledChapters")) {
      const publishResult = await processScheduledChapters();
      results.publishScheduledChapters = {
        message: "Processed scheduled chapters",
        count: publishResult.publishedChapters,
        details: publishResult
      };

      logger.info("Processed scheduled chapters", {
        publishedChapters: publishResult.publishedChapters,
        updatedStories: publishResult.updatedStories
      });
    }

    // Add more scheduled tasks here as needed

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        results
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error in scheduled tasks", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json(
      {
        error: "Failed to process scheduled tasks",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
