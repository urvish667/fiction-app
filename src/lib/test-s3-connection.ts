import { s3Client, BUCKET_NAME } from "./aws-config";
import { ListObjectsCommand } from "@aws-sdk/client-s3";

/**
 * Test S3 connection and configuration
 * This function can be used to verify that AWS credentials are properly set up
 */
export async function testS3Connection() {
  try {
    console.log("Testing S3 connection...");
    console.log("AWS Region:", process.env.AWS_REGION || "us-east-1");
    console.log("S3 Bucket:", BUCKET_NAME);
    
    // Check if credentials are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error("AWS credentials are not set in environment variables");
      return {
        success: false,
        message: "AWS credentials are not set in environment variables"
      };
    }
    
    // Try to list objects in the bucket
    const command = new ListObjectsCommand({
      Bucket: BUCKET_NAME,
      MaxKeys: 1
    });
    
    const response = await s3Client.send(command);
    
    return {
      success: true,
      message: "S3 connection successful",
      data: response
    };
  } catch (error) {
    console.error("S3 connection test failed:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
      error
    };
  }
}
