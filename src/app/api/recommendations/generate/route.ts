import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/auth/db-adapter";
import { generateRecommendations, generateRecommendationsForStory } from "@/lib/recommendation-service";
import { logger } from "@/lib/logger";
import { z } from "zod";

// Create a dedicated logger for the API endpoint
const apiLogger = logger.child("api-recommendations-generate");

// Request body schema
const requestSchema = z.object({
  storyId: z.string().uuid().optional(),
  config: z.object({
    maxRecommendationsPerStory: z.number().int().positive().optional(),
    similarityThreshold: z.number().min(0).max(1).optional(),
    excludeSameAuthor: z.boolean().optional(),
    batchSize: z.number().int().positive().optional(),
  }).optional(),
});

/**
 * API route to generate recommendations
 *
 * This endpoint can be called by an external cron job service or manually
 * to generate recommendations for all stories or a specific story.
 *
 * It requires an API key for security, which should be set in the environment variables.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check for API key authorization
    const authHeader = request.headers.get("authorization");
    const apiKey = process.env.RECOMMENDATIONS_API_KEY;

    if (!apiKey) {
      apiLogger.warn("RECOMMENDATIONS_API_KEY is not set in environment variables");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (!authHeader || authHeader !== `Bearer ${apiKey}`) {
      apiLogger.warn("Unauthorized access attempt", {
        authHeader: authHeader ? "Present but invalid" : "Missing",
        ip: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown",
      });

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
      requestSchema.parse(body);
    } catch (error) {
      apiLogger.warn("Invalid request body", { error });

      return NextResponse.json(
        {
          error: "Invalid request body",
          details: error instanceof Error ? error.message : "Unknown error"
        },
        { status: 400 }
      );
    }

    // Extract parameters
    const { storyId, config } = body;

    // Generate recommendations
    let result;
    if (storyId) {
      apiLogger.info(`Generating recommendations for story ${storyId}`);
      const recommendationsCount = await generateRecommendationsForStory(prisma, storyId, config);
      result = {
        storyId,
        recommendationsGenerated: recommendationsCount
      };
    } else {
      apiLogger.info("Generating recommendations for all stories");
      result = await generateRecommendations(prisma, config);
    }

    const duration = Date.now() - startTime;

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
        result
      },
      { status: 200 }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    apiLogger.error("Error in recommendation generation", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        error: "Failed to generate recommendations",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        duration: `${duration}ms`,
      },
      { status: 500 }
    );
  }
}
