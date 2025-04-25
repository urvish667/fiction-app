import { NextRequest, NextResponse } from "next/server";
import { AzureService } from "@/lib/azure-service";

// GET endpoint to serve images from Azure Blob Storage
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
