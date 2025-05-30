import { blobServiceClient, CONTAINER_NAME } from "./azure-config";
import { BlobSASPermissions, generateBlobSASQueryParameters, SASProtocol, StorageSharedKeyCredential } from "@azure/storage-blob";
import { Buffer } from "buffer";
import { logError } from "./error-logger";

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
      logError(error, { context: 'Uploading content to Azure Blob Storage' });
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
      logError(error, { context: 'Uploading image to Azure Blob Storage' });
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
      logError(error, { context: 'Fetching content from Azure Blob Storage' });
      throw new Error("Failed to retrieve content");
    }
  },

  /**
   * Get image data from Azure Blob Storage
   * @param key The blob name (path)
   */
  async getImageData(key: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(key);

      const downloadResponse = await blockBlobClient.download(0);

      if (!downloadResponse.readableStreamBody) {
        throw new Error("No readable stream available");
      }

      // Get the content type from blob properties
      const contentType = downloadResponse.contentType || 'image/jpeg';

      // Convert stream to buffer
      const buffer = await streamToBuffer(downloadResponse.readableStreamBody);

      if (!buffer || buffer.byteLength === 0) {
        throw new Error("Empty image data");
      }

      return { buffer, contentType };
    } catch (error) {
      logError(error, { context: 'Fetching image data from Azure Blob Storage' });
      throw new Error("Failed to retrieve image data");
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
      logError(error, { context: 'Deleting content from Azure Blob Storage' });
      throw new Error("Failed to delete content");
    }
  },

  /**
   * Generate a signed URL for reading content (kept for backward compatibility)
   * @param key The blob name (path)
   * @param expiresIn Expiration time in seconds (default: 3600)
   * @deprecated Use getImageData() for images or serve through API endpoints
   */
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    try {
      const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
      const blockBlobClient = containerClient.getBlockBlobClient(key);

      // Get blob properties to ensure it exists
      await blockBlobClient.getProperties();

      // Check if credential is available for SAS generation
      if (!blockBlobClient.credential || !(blockBlobClient.credential instanceof StorageSharedKeyCredential)) {
        // Return a direct URL to our API endpoint as fallback
        return `/api/images/${encodeURIComponent(key)}`;
      }

      // Create SAS token with read permissions
      const sasOptions = {
        containerName: CONTAINER_NAME,
        blobName: key,
        permissions: BlobSASPermissions.parse("r"), // Read permission
        protocol: SASProtocol.Https,
        startsOn: new Date(Date.now() - 5 * 60 * 1000), // Start 5 minutes ago to account for clock skew
        expiresOn: new Date(new Date().valueOf() + expiresIn * 1000),
      };

      // Generate SAS token
      const sasToken = generateBlobSASQueryParameters(
        sasOptions,
        blockBlobClient.credential as StorageSharedKeyCredential
      ).toString();

      return `${blockBlobClient.url}?${sasToken}`;
    } catch (error) {
      logError(error, { context: 'Generating signed URL', key });
      // Return a direct URL to our API endpoint as fallback
      return `/api/images/${encodeURIComponent(key)}`;
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

/**
 * Helper function to convert a readable stream to an ArrayBuffer
 */
async function streamToBuffer(readableStream: NodeJS.ReadableStream | undefined): Promise<ArrayBuffer> {
  if (!readableStream) {
    return new ArrayBuffer(0);
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    readableStream.on("data", (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on("end", () => {
      const buffer = Buffer.concat(chunks);
      resolve(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
    });
    readableStream.on("error", reject);
  });
}
