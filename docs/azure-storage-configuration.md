# Azure Blob Storage Configuration for FableSpace

This document explains how to configure Azure Blob Storage for the FableSpace application.

## Overview

FableSpace uses Azure Blob Storage to store:
- User profile pictures
- User banner images
- Story cover images
- Editor images (for content within stories)
- Story chapter content (stored as text files)

## Environment Variables

Add the following variables to your environment:

```env
AZURE_STORAGE_CONNECTION_STRING=your_azure_storage_connection_string
AZURE_STORAGE_CONTAINER_NAME=your_container_name
```

### Connection String

The connection string can be found in the Azure Portal:
1. Go to your Storage Account
2. Navigate to "Access keys" under "Security + networking"
3. Copy the "Connection string" value

The connection string should look like this:
```
DefaultEndpointsProtocol=https;AccountName=yourstorageaccount;AccountKey=yourstorageaccountkey;EndpointSuffix=core.windows.net
```

Make sure to include this exact format in your `.env` file. The application will parse this connection string to extract the account name, account key, and endpoint suffix.

### Container Name

This is the name of the container where all files will be stored. You can use:
- `fiction-app-dev` for development
- `fiction-app-prod` for production
- Or any other name you prefer

## Creating a Storage Account and Container

If you don't have an Azure Storage Account yet:

1. Sign in to the [Azure Portal](https://portal.azure.com)
2. Create a new Storage Account:
   - Click "Create a resource"
   - Search for "Storage account"
   - Click "Create"
   - Fill in the required details:
     - Subscription: Your Azure subscription
     - Resource group: Create new or use existing
     - Storage account name: A unique name (e.g., `fablespacefiles`)
     - Region: Choose a region close to your users
     - Performance: Standard
     - Redundancy: Locally-redundant storage (LRS) for development, Geo-redundant storage (GRS) for production
   - Click "Review + create"
   - Click "Create"

3. Create a container:
   - Go to your new Storage Account
   - Navigate to "Containers" under "Data storage"
   - Click "+ Container"
   - Name: `fiction-app-dev` (or your preferred name)
   - Public access level: "Private (no anonymous access)"
   - Click "Create"

## CORS Configuration

To allow browser uploads, you need to configure CORS for your Storage Account:

1. Go to your Storage Account
2. Navigate to "Resource sharing (CORS)" under "Settings"
3. Add a new CORS rule:
   - Allowed origins: `*` (or your specific domain for production)
   - Allowed methods: `GET`, `PUT`, `POST`, `DELETE`, `HEAD`
   - Allowed headers: `*`
   - Exposed headers: `*`
   - Max age: `86400` (24 hours)
4. Click "Save"

## Testing the Connection

You can test your Azure Blob Storage connection by running:

```typescript
import { testAzureConnection } from "@/lib/test-azure-connection";

// In an async function
const result = await testAzureConnection();
console.log(result);
```

## Migrating from S3

If you're migrating from S3, you'll need to copy all your files from S3 to Azure Blob Storage. You can use the Azure Storage Explorer or write a script to do this.

### Example Migration Script

```typescript
import { S3Service } from "@/lib/s3-service";
import { AzureService } from "@/lib/azure-service";
import { s3Client, BUCKET_NAME } from "@/lib/aws-config";
import { ListObjectsCommand } from "@aws-sdk/client-s3";

async function migrateFromS3ToAzure() {
  try {
    // List all objects in the S3 bucket
    const command = new ListObjectsCommand({
      Bucket: BUCKET_NAME,
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      console.log("No objects found in S3 bucket");
      return;
    }

    console.log(`Found ${response.Contents.length} objects in S3 bucket`);

    // Migrate each object
    for (const object of response.Contents) {
      if (!object.Key) continue;

      console.log(`Migrating ${object.Key}...`);

      // Get the content from S3
      const content = await S3Service.getContent(object.Key);

      // Upload to Azure
      await AzureService.uploadContent(object.Key, content);

      console.log(`Migrated ${object.Key}`);
    }

    console.log("Migration complete");
  } catch (error) {
    console.error("Migration error:", error);
  }
}
```

## Security Considerations

- The Azure Storage connection string contains sensitive information. Never expose it in client-side code.
- Use SAS tokens with appropriate permissions and expiration times for client access.
- Consider using Azure Key Vault to store the connection string in production.
- Implement proper access controls and monitoring for your Storage Account.
