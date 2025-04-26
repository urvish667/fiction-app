import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { AzureService } from "@/lib/azure-service";
import { logger } from "@/lib/logger";

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Validation schema for image upload
const uploadImageSchema = z.object({
  key: z.string().min(1, "Image key is required"),
  contentType: z.string().startsWith("image/", "File must be an image"),
  data: z.array(z.number()).refine(arr => {
    // Check if array size is within limits
    return arr.length <= MAX_FILE_SIZE;
  }, "File size exceeds the 10MB limit"),
});

/**
 * POST endpoint to upload an image to Azure Blob Storage
 * Requires authentication and validates the image data
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = uploadImageSchema.parse(body);

    // Convert array back to ArrayBuffer
    const uint8Array = new Uint8Array(validatedData.data);

    // Upload to Azure Blob Storage
    logger.info('Uploading image to Azure Blob Storage', {
      key: validatedData.key,
      userId: session.user.id,
      contentType: validatedData.contentType,
      size: uint8Array.length
    });

    const imageUrl = await AzureService.uploadImage(
      validatedData.key,
      uint8Array.buffer,
      validatedData.contentType
    );

    logger.info('Image uploaded successfully', {
      key: validatedData.key,
      userId: session.user.id
    });

    return NextResponse.json({ url: imageUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('Image upload validation error', {
        errors: error.errors
      });

      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    logger.error('Error uploading image', {
      error: error instanceof Error ? error.message : String(error)
    });

    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
