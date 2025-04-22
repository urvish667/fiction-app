import { blobServiceClient, CONTAINER_NAME } from "./azure-config";
import { BlobSASPermissions, generateBlobSASQueryParameters, SASProtocol, StorageSharedKeyCredential } from "@azure/storage-blob";
import { Buffer } from "buffer";

/**
 * Service for interacting with Azure Blob Storage
 */
export const AzureService = {
  /**
   * Upload content to Azure Blob Storage
   * @param key The blob name (path)
   * @param content The content to upload
   * @param contentType The content type (default: text/plain)
   */
  async uploadContent(key: string, content: string, contentType = "text/plain"): Promise<string> {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(key);

      await blockBlobClient.upload(content, content.length, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });

      return key;
    } catch (error) {
      console.error("Error uploading to Azure Blob Storage:", error);
      throw new Error("Failed to upload content");
    }
  },

  /**
   * Upload binary data to Azure Blob Storage (for images)
   * @param key The blob name (path)
   * @param data The binary data to upload
   * @param contentType The content type (default: image/jpeg)
   */
  async uploadImage(key: string, data: ArrayBuffer, contentType = "image/jpeg"): Promise<string> {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(key);

      await blockBlobClient.uploadData(Buffer.from(data), {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });

      // Return a URL that will be handled by our own API
      return `/api/images/${encodeURIComponent(key)}`;
    } catch (error) {
      console.error("Error uploading image to Azure Blob Storage:", error);
      throw new Error("Failed to upload image");
    }
  },

  /**
   * Get content from Azure Blob Storage
   * @param key The blob name (path)
   */
  async getContent(key: string): Promise<string> {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(key);

      const downloadResponse = await blockBlobClient.download(0);
      const content = await streamToString(downloadResponse.readableStreamBody);

      if (!content) {
        throw new Error("Empty content");
      }

      return content;
    } catch (error) {
      console.error("Error getting content from Azure Blob Storage:", error);
      throw new Error("Failed to retrieve content");
    }
  },

  /**
   * Delete content from Azure Blob Storage
   * @param key The blob name (path)
   */
  async deleteContent(key: string): Promise<void> {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(key);

      await blockBlobClient.delete();
    } catch (error) {
      console.error("Error deleting content from Azure Blob Storage:", error);
      throw new Error("Failed to delete content");
    }
  },

  /**
   * Generate a signed URL for reading content
   * @param key The blob name (path)
   * @param expiresIn Expiration time in seconds (default: 3600)
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(key);

      // Get blob properties to ensure it exists
      await blockBlobClient.getProperties();

      try {
        // Check if credential is available for SAS generation
        if (!blockBlobClient.credential || !(blockBlobClient.credential instanceof StorageSharedKeyCredential)) {
          console.error("No valid credential available for SAS token generation");
          // Return a direct URL to our API endpoint as fallback
          return `/api/images/${encodeURIComponent(key)}`;
        }

        // Create SAS token with read permissions
        const sasOptions = {
          containerName: CONTAINER_NAME,
          blobName: key,
          permissions: BlobSASPermissions.parse("r"), // Read permission
          protocol: SASProtocol.Https,
          startsOn: new Date(),
          expiresOn: new Date(new Date().valueOf() + expiresIn * 1000),
        };

        // Generate SAS token
        const sasToken = generateBlobSASQueryParameters(
          sasOptions,
          blockBlobClient.credential as StorageSharedKeyCredential
        ).toString();

        // Return the full URL with SAS token
        return `${blockBlobClient.url}?${sasToken}`;
      } catch (sasError) {
        console.error("Error generating SAS token:", sasError);
        // Return a direct URL to our API endpoint as fallback
        return `/api/images/${encodeURIComponent(key)}`;
      }
    } catch (error) {
      console.error("Error generating signed URL:", error);
      throw new Error("Failed to generate signed URL");
    }
  }
};

/**
 * Helper function to convert a readable stream to a string
 */
async function streamToString(readableStream: NodeJS.ReadableStream | undefined): Promise<string> {
  if (!readableStream) {
    return "";
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    readableStream.on("error", reject);
  });
}
