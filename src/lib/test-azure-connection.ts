import { blobServiceClient, CONTAINER_NAME } from "./azure-config";

/**
 * Test Azure Blob Storage connection and configuration
 * This function can be used to verify that Azure credentials are properly set up
 */
export async function testAzureConnection() {
  try {
    console.log("Testing Azure Blob Storage connection...");
    console.log("Azure Storage Container:", CONTAINER_NAME);

    // Check if connection string is set
    if (!process.env.AZURE_STORAGE_CONNECTION_STRING) {
      console.error("Azure Storage connection string is not set in environment variables");
      return {
        success: false,
        message: "Azure Storage connection string is not set in environment variables"
      };
    }

    // Try to get container properties
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const containerProperties = await containerClient.getProperties();

    console.log("Successfully connected to Azure Blob Storage");
    console.log("Container properties:", {
      etag: containerProperties.etag,
      lastModified: containerProperties.lastModified,
      leaseDuration: containerProperties.leaseDuration,
      leaseState: containerProperties.leaseState,
      leaseStatus: containerProperties.leaseStatus,
    });

    // Try to list blobs in the container
    let blobCount = 0;
    const iterator = containerClient.listBlobsFlat().byPage({ maxPageSize: 5 });
    for await (const response of iterator) {
      for (const blob of response.segment.blobItems) {
        console.log(`Blob: ${blob.name}`);
        blobCount++;
        if (blobCount >= 5) break; // Only show up to 5 blobs
      }
      if (blobCount >= 5) break; // Break out of the outer loop if we've shown 5 blobs
    }

    return {
      success: true,
      message: "Successfully connected to Azure Blob Storage"
    };
  } catch (error) {
    console.error("Azure Blob Storage connection error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

