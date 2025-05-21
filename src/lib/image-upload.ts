import { AzureService } from "./azure-service";
import { fetchWithCsrf } from "./client/csrf";
import { logError } from "./error-logger";

/**
 * Utility for handling image uploads
 */
export const ImageUpload = {
  /**
   * Upload a profile image to Azure Blob Storage
   * @param userId The user ID
   * @param file The image file
   * @returns The URL of the uploaded image
   */
  async uploadProfileImage(userId: string, file: File): Promise<string> {
    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Generate a unique key for the image
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const imageKey = `users/${userId}/profile-${timestamp}.${fileExtension}`;

      // Upload to Azure Blob Storage via the API with CSRF token
      const response = await fetchWithCsrf('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: imageKey,
          contentType: file.type,
          data: Array.from(new Uint8Array(arrayBuffer)),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload profile image');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      logError(error, { context: 'Uploading profile image' })
      throw error;
    }
  },

  /**
   * Upload a banner image to Azure Blob Storage
   * @param userId The user ID
   * @param file The image file
   * @returns The URL of the uploaded image
   */
  async uploadBannerImage(userId: string, file: File): Promise<string> {
    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Generate a unique key for the image
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const imageKey = `users/${userId}/banner-${timestamp}.${fileExtension}`;

      // Upload to Azure Blob Storage via the API with CSRF token
      const response = await fetchWithCsrf('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: imageKey,
          contentType: file.type,
          data: Array.from(new Uint8Array(arrayBuffer)),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload banner image');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      logError(error, { context: 'Uploading banner image' })
      throw error;
    }
  },

  /**
   * Process an image before upload (resize, compress, etc.)
   * @param file The image file
   * @param maxWidth Maximum width
   * @param maxHeight Maximum height
   * @returns Processed image as a File object
   */
  async processImage(file: File, maxWidth = 1200, maxHeight = 1200): Promise<File> {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
          // Release the object URL
          URL.revokeObjectURL(url);

          // Get original dimensions
          let width = img.width;
          let height = img.height;

          // Only resize if the image is larger than the specified dimensions
          let needsResize = false;

          // Store original aspect ratio
          const aspectRatio = width / height;

          // Calculate new dimensions while maintaining aspect ratio
          if (width > maxWidth) {
            height = Math.round((maxWidth / aspectRatio));
            width = maxWidth;
            needsResize = true;
          }

          if (height > maxHeight) {
            width = Math.round((maxHeight * aspectRatio));
            height = maxHeight;
            needsResize = true;
          }

          // If the image is already smaller than the max dimensions, just return the original file
          if (!needsResize) {
            resolve(file);
            return;
          }

          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          // Draw the image on the canvas
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Failed to get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              // Create a new file from the blob
              const newFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });

              resolve(newFile);
            },
            'image/jpeg',
            0.85 // Quality
          );
        };

        img.onerror = () => {
          URL.revokeObjectURL(url);
          reject(new Error('Failed to load image'));
        };

        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Upload an editor image to Azure Blob Storage
   * @param file The image file
   * @returns The URL of the uploaded image
   */
  async uploadEditorImage(file: File): Promise<string> {
    try {
      // Read the file as an ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();

      // Generate a unique key for the image
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const imageKey = `editor/images/${timestamp}-${Math.random().toString(36).substring(2, 10)}.${fileExtension}`;

      // Upload to Azure Blob Storage via the API with CSRF token
      const response = await fetchWithCsrf('/api/upload-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: imageKey,
          contentType: file.type,
          data: Array.from(new Uint8Array(arrayBuffer)),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload editor image');
      }

      const result = await response.json();
      return result.url;
    } catch (error) {
      logError(error, { context: 'Uploading editor image' })
      throw error;
    }
  }
};
