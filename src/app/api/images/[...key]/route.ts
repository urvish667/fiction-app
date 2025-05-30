import { NextRequest, NextResponse } from "next/server";
import { AzureService } from "@/lib/azure-service";
import { logger } from "@/lib/logger";

// Cache control constants
const CACHE_CONTROL_HEADER = 'Cache-Control';
const CACHE_VALUE = 'public, max-age=3600, stale-while-revalidate=86400';

/**
 * Add CORS headers for image requests
 */
function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.set('Access-Control-Max-Age', '86400');
  return response;
}

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 204 });
  return addCorsHeaders(response);
}

/**
 * GET endpoint to serve images directly from Azure Blob Storage
 * Downloads the image from Azure and serves it directly through the API
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

    logger.info('Image request received', {
      key,
      userAgent: request.headers.get('user-agent')?.substring(0, 100) || 'unknown',
      referer: request.headers.get('referer') || 'unknown'
    });

    // Get the image data directly from Azure Blob Storage
    const imageData = await AzureService.getImageData(key);

    // Create response with the image data
    const response = new NextResponse(imageData.buffer, {
      status: 200,
      headers: {
        'Content-Type': imageData.contentType,
        'Content-Length': imageData.buffer.byteLength.toString(),
        [CACHE_CONTROL_HEADER]: CACHE_VALUE,
      },
    });

    // Add CORS headers
    addCorsHeaders(response);

    logger.info('Image served successfully', {
      key,
      contentType: imageData.contentType,
      size: imageData.buffer.byteLength
    });

    return response;
  } catch (error) {
    const resolvedParams = await params;
    const key = resolvedParams.key?.join('/') || 'unknown';

    logger.error('Error serving image', {
      error: error instanceof Error ? error.message : String(error),
      key,
      stack: error instanceof Error ? error.stack : undefined,
      path: request.nextUrl.pathname
    });

    // Return a 404 response for missing images with CORS headers
    const errorResponse = new NextResponse('Image not found', { status: 404 });
    addCorsHeaders(errorResponse);
    return errorResponse;
  }
}
