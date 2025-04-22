// Script to migrate files from AWS S3 to Azure Blob Storage
require('dotenv').config();
const { S3Client, ListObjectsV2Command, GetObjectCommand } = require('@aws-sdk/client-s3');
const { BlobServiceClient, StorageSharedKeyCredential } = require('@azure/storage-blob');
const { Readable } = require('stream');

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

// AWS S3 configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'fiction-app-dev';

// Azure Blob Storage configuration
let blobServiceClient;
try {
  // Check if connection string is provided
  if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
    throw new Error('AZURE_STORAGE_CONNECTION_STRING is not set in environment variables');
  }

  // Create the BlobServiceClient using our helper function
  blobServiceClient = createBlobServiceClient(process.env.AZURE_STORAGE_CONNECTION_STRING);
  console.log('Successfully created Azure Blob Service Client');
} catch (error) {
  console.error('Error creating Azure Blob Service Client:', error.message);
  process.exit(1);
}

const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME || 'fiction-app-dev';

// Helper function to stream S3 object to Azure Blob
async function streamS3ObjectToAzure(key, contentType) {
  try {
    // Get object from S3
    const getObjectParams = {
      Bucket: BUCKET_NAME,
      Key: key,
    };

    const s3Response = await s3Client.send(new GetObjectCommand(getObjectParams));

    // Get Azure container client
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blockBlobClient = containerClient.getBlockBlobClient(key);

    // Stream the data from S3 to Azure
    const readableStream = s3Response.Body;

    // Set content type if provided
    const options = {};
    if (contentType) {
      options.blobHTTPHeaders = {
        blobContentType: contentType
      };
    }

    // Upload to Azure
    await blockBlobClient.uploadStream(readableStream, undefined, undefined, options);

    console.log(`Successfully migrated: ${key}`);
    return true;
  } catch (error) {
    console.error(`Error migrating ${key}:`, error);
    return false;
  }
}

// Main migration function
async function migrateFromS3ToAzure() {
  try {
    console.log('Starting migration from S3 to Azure Blob Storage...');

    // Check if Azure container exists, create if not
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const containerExists = await containerClient.exists();

    if (!containerExists) {
      console.log(`Container ${CONTAINER_NAME} does not exist. Creating...`);
      await containerClient.create();
      console.log(`Container ${CONTAINER_NAME} created.`);
    }

    // List all objects in the S3 bucket
    let continuationToken = undefined;
    let totalObjects = 0;
    let migratedObjects = 0;
    let failedObjects = 0;

    do {
      const listParams = {
        Bucket: BUCKET_NAME,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      };

      const listResponse = await s3Client.send(new ListObjectsV2Command(listParams));
      const objects = listResponse.Contents || [];

      console.log(`Found ${objects.length} objects in this batch.`);
      totalObjects += objects.length;

      // Process each object
      for (const object of objects) {
        const key = object.Key;

        // Determine content type based on file extension
        let contentType = 'application/octet-stream'; // default
        if (key.endsWith('.jpg') || key.endsWith('.jpeg')) {
          contentType = 'image/jpeg';
        } else if (key.endsWith('.png')) {
          contentType = 'image/png';
        } else if (key.endsWith('.gif')) {
          contentType = 'image/gif';
        } else if (key.endsWith('.txt')) {
          contentType = 'text/plain';
        } else if (key.endsWith('.html')) {
          contentType = 'text/html';
        } else if (key.endsWith('.json')) {
          contentType = 'application/json';
        }

        const success = await streamS3ObjectToAzure(key, contentType);
        if (success) {
          migratedObjects++;
        } else {
          failedObjects++;
        }
      }

      // Check if there are more objects to list
      continuationToken = listResponse.NextContinuationToken;

    } while (continuationToken);

    console.log('\nMigration Summary:');
    console.log(`Total objects: ${totalObjects}`);
    console.log(`Successfully migrated: ${migratedObjects}`);
    console.log(`Failed to migrate: ${failedObjects}`);

    if (failedObjects === 0) {
      console.log('Migration completed successfully!');
    } else {
      console.log('Migration completed with some errors. Check the logs for details.');
    }

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

// Run the migration
migrateFromS3ToAzure().catch(console.error);
