import { NextRequest, NextResponse } from "next/server";
import { AzureService } from "@/lib/azure-service";
import { logger } from "@/lib/logger";

// Cache control constants
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_VALUE = 'public, max-age=3600, stale-while-revalidate=86400';

/**
 * GET endpoint to serve images from Azure Blob Storage
 * Generates a signed URL and redirects to it
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string[] }> }
) {
  try {
    // Get the key from the URL - await the params in Next.js 14
    const resolvedParams = await params;
    const keyParts = resolvedParams.key;
    const key = keyParts.join('/');

    // Generate a signed URL with a short expiration (1 hour)
    const signedUrl = await AzureService.getSignedUrl(key, 3600);

    // Create response with redirect and cache headers
    const response = NextResponse.redirect(signedUrl);
    response.headers.set(CACHE_CONTROL_HEADER, CACHE_VALUE);

    return response;
  } catch (error) {
    // Log the error with structured context
    logger.error('Error serving image', {
      error: error instanceof Error ? error.message : String(error),
      path: request.nextUrl.pathname
    });

    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
