import { NextRequest, NextResponse } from "next/server";
import { S3Service } from "@/lib/s3-service";

// GET endpoint to serve images from S3
export async function GET(
  request: NextRequest,
  context: { params: { key: string[] } | Promise<{ key: string[] }> }
) {
  try {
    // Get the key from the URL - await the params in Next.js 14
    const params = await context.params;
    const keyParts = params.key;
    const key = keyParts.join('/');

    // Generate a signed URL with a short expiration (1 hour)
    const signedUrl = await S3Service.getSignedUrl(key, 3600);

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    console.error("Error serving image:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
