import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";
import { logError } from "./error-logger";

// Function to create BlobServiceClient from connection string
function createBlobServiceClient(connectionString: string): BlobServiceClient {
  // Check if it's a connection string with AccountName and AccountKey format
  if (connectionString.includes('AccountName') && connectionString.includes('AccountKey')) {
    try {
      // Parse the connection string manually
      const parts = connectionString.split(';');
      let accountName = '';
      let accountKey = '';
      let endpointSuffix = 'core.windows.net';

      for (const part of parts) {
        if (part.startsWith('AccountName=')) {
          accountName = part.split('=')[1];
        } else if (part.startsWith('AccountKey=')) {
          accountKey = part.split('=')[1];
        } else if (part.startsWith('EndpointSuffix=')) {
          endpointSuffix = part.split('=')[1];
        }
      }

      if (!accountName || !accountKey) {
        throw new Error('Invalid connection string format: AccountName or AccountKey not found');
      }

      // Create a StorageSharedKeyCredential
      const sharedKeyCredential = new StorageSharedKeyCredential(accountName, accountKey);

      // Create the BlobServiceClient using the credential
      const blobServiceUrl = `https://${accountName}.blob.${endpointSuffix}`;
      return new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
    } catch (error) {
      logError(error, { context: 'Parsing Azure connection string' });
      throw error;
    }
  } else {
    // Try the standard way
    return new BlobServiceClient(connectionString);
  }
}

// Azure Blob Storage configuration
let blobServiceClient: BlobServiceClient;

try {
  if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
    // Create a dummy client that will throw errors when used
    blobServiceClient = new BlobServiceClient("https://example.com");
  } else {
    // Create the BlobServiceClient using our helper function
    blobServiceClient = createBlobServiceClient(process.env.AZURE_STORAGE_CONNECTION_STRING);
  }
} catch (error) {
  logError(error, { context: 'Creating Azure Blob Service Client' });
  // Create a dummy client that will throw errors when used
  blobServiceClient = new BlobServiceClient("https://example.com");
}

export { blobServiceClient };

// Container name
export const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "fiction-app-dev";
