import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, BUCKET_NAME } from "./aws-config";

/**
 * Service for interacting with AWS S3
 */
export const S3Service = {
  /**
   * Upload content to S3
   * @param key The S3 object key (path)
   * @param content The content to upload
   * @param contentType The content type (default: text/plain)
   */
  async uploadContent(key: string, content: string, contentType = "text/plain"): Promise<string> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    };

    try {
      await s3Client.send(new PutObjectCommand(params));
      return key;
    } catch (error) {
      console.error("Error uploading to S3:", error);
      throw new Error("Failed to upload content");
    }
  },

  /**
   * Upload binary data to S3 (for images)
   * @param key The S3 object key (path)
   * @param data The binary data to upload
   * @param contentType The content type (default: image/jpeg)
   */
  async uploadImage(key: string, data: ArrayBuffer, contentType = "image/jpeg"): Promise<string> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: data,
      ContentType: contentType,
      // Removed ACL parameter as it's not supported in the current bucket configuration
    };

    try {
      await s3Client.send(new PutObjectCommand(params));

      // Instead of using a signed URL with a long expiration,
      // we'll return a URL that will be handled by our own API
      return `/api/images/${encodeURIComponent(key)}`;
    } catch (error) {
      console.error("Error uploading image to S3:", error);
      throw new Error("Failed to upload image");
    }
  },

  /**
   * Get content from S3
   * @param key The S3 object key (path)
   */
  async getContent(key: string): Promise<string> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    try {
      const response = await s3Client.send(new GetObjectCommand(params));
      const content = await response.Body?.transformToString();

      if (!content) {
        throw new Error("Empty content");
      }

      return content;
    } catch (error) {
      console.error("Error getting content from S3:", error);
      throw new Error("Failed to retrieve content");
    }
  },

  /**
   * Delete content from S3
   * @param key The S3 object key (path)
   */
  async deleteContent(key: string): Promise<void> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    try {
      await s3Client.send(new DeleteObjectCommand(params));
    } catch (error) {
      console.error("Error deleting content from S3:", error);
      throw new Error("Failed to delete content");
    }
  },

  /**
   * Generate a pre-signed URL for reading content
   * @param key The S3 object key (path)
   * @param expiresIn Expiration time in seconds (default: 3600)
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    try {
      return await getSignedUrl(s3Client, new GetObjectCommand(params), { expiresIn });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      throw new Error("Failed to generate signed URL");
    }
  }
};
