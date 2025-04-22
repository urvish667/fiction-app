// Script to test Azure Blob Storage connection
require('dotenv').config();
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');

// Function to create BlobServiceClient from connection string
function createBlobServiceClient(connectionString) {
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
      console.log(`Creating BlobServiceClient with URL: ${blobServiceUrl}`);
      return new BlobServiceClient(blobServiceUrl, sharedKeyCredential);
    } catch (error) {
      console.error('Error parsing connection string:', error.message);
      throw error;
    }
  } else {
    // Try the standard way
    return new BlobServiceClient(connectionString);
  }
}

async function testAzureConnection() {
  try {
    console.log("Testing Azure Blob Storage connection...");
    
    // Check if connection string is set
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      console.error("Azure Storage connection string is not set in environment variables");
      return;
    }
    
    const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'fiction-app-dev';
    console.log("Azure Storage Container:", CONTAINER_NAME);
    
    // Create the BlobServiceClient
    const blobServiceClient = createBlobServiceClient(process.env.AZURE_STORAGE_CONNECTION_STRING);
    console.log("Successfully created Azure Blob Service Client");
    
    // Try to get container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    console.log("Successfully created Container Client");
    
    // Check if container exists
    const containerExists = await containerClient.exists();
    console.log(`Container ${CONTAINER_NAME} exists: ${containerExists}`);
    
    if (!containerExists) {
      console.log(`Creating container ${CONTAINER_NAME}...`);
      await containerClient.create();
      console.log(`Container ${CONTAINER_NAME} created successfully`);
    } else {
      // Try to get container properties
      const containerProperties = await containerClient.getProperties();
      console.log("Container properties:", {
        etag: containerProperties.etag,
        lastModified: containerProperties.lastModified,
        leaseDuration: containerProperties.leaseDuration,
        leaseState: containerProperties.leaseState,
        leaseStatus: containerProperties.leaseStatus,
      });
      
      // Try to list blobs in the container
      console.log("Listing blobs in container...");
      let blobCount = 0;
      const iterator = containerClient.listBlobsFlat({ maxResults: 5 });
      let blobsFound = false;
      
      for await (const blob of iterator) {
        console.log(`Blob: ${blob.name}`);
        blobCount++;
        blobsFound = true;
        if (blobCount >= 5) break; // Only show up to 5 blobs
      }
      
      if (!blobsFound) {
        console.log("No blobs found in container");
        
        // Try to upload a test blob
        console.log("Uploading a test blob...");
        const blockBlobClient = containerClient.getBlockBlobClient('test-blob.txt');
        const content = "This is a test blob created at " + new Date().toISOString();
        await blockBlobClient.upload(content, content.length);
        console.log("Test blob uploaded successfully");
        
        // Try to download the test blob
        console.log("Downloading the test blob...");
        const downloadResponse = await blockBlobClient.download(0);
        const downloadedContent = await streamToString(downloadResponse.readableStreamBody);
        console.log("Downloaded content:", downloadedContent);
        
        // Delete the test blob
        console.log("Deleting the test blob...");
        await blockBlobClient.delete();
        console.log("Test blob deleted successfully");
      }
    }
    
    console.log("Azure Blob Storage connection test completed successfully");
  } catch (error) {
    console.error("Azure Blob Storage connection test failed:", error);
  }
}

// Helper function to convert a readable stream to a string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (data) => {
      chunks.push(Buffer.from(data));
    });
    readableStream.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
    readableStream.on("error", reject);
  });
}

// Run the test
testAzureConnection().catch(console.error);
