import { BlobServiceClient, StorageSharedKeyCredential } from "@azure/storage-blob";

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
      console.error('Error parsing connection string:', error);
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
    console.error("AZURE_STORAGE_CONNECTION_STRING is not set in environment variables");
    // Create a dummy client that will throw errors when used
    blobServiceClient = new BlobServiceClient("https://example.com");
  } else {
    // Create the BlobServiceClient using our helper function
    blobServiceClient = createBlobServiceClient(process.env.AZURE_STORAGE_CONNECTION_STRING);
  }
} catch (error) {
  console.error("Error initializing Azure Blob Storage:", error);
  // Create a dummy client that will throw errors when used
  blobServiceClient = new BlobServiceClient("https://example.com");
}

export { blobServiceClient };

// Container name
export const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || "fiction-app-dev";
