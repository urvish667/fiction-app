import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { S3Service } from "@/lib/s3-service";

// Validation schema for image upload
const uploadImageSchema = z.object({
  key: z.string(),
  contentType: z.string().startsWith("image/"),
  data: z.array(z.number()),
});

// POST endpoint to upload an image
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

    // Upload to S3
    console.log('Uploading image to S3 with key:', validatedData.key);
    const imageUrl = await S3Service.uploadImage(
      validatedData.key,
      uint8Array.buffer,
      validatedData.contentType
    );
    console.log('Image uploaded, URL:', imageUrl);

    return NextResponse.json({ url: imageUrl }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Error uploading image:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
