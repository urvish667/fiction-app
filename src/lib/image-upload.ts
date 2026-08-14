import { apiClient } from "./apiClient";
import { logError } from "./error-logger";

/**
 * Extract a human-readable, specific error message from an API or network error
 */
function getErrorMessage(error: any, fallback: string): string {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.error?.message) return error.response.data.error.message;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message) return error.message;
  return fallback;
}

/**
 * Utility for handling image uploads
 */
export const ImageUpload = {
  /**
   * Upload a profile image
   * @param userId The user ID
   * @param file The image file
   * @returns The URL of the uploaded image
   */
  async uploadProfileImage(userId: string, file: File): Promise<string> {
    try {
      // Validate file size client-side first
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size exceeds the 10MB limit. Please choose a smaller image.');
      }

      // Generate a unique key for the image
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const imageKey = `users/${userId}/profile-${timestamp}.${fileExtension}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', imageKey);

      // Upload binary multipart directly to backend API
      const response = await apiClient.post<{
        success: boolean;
        data: { key: string; url: string };
        error?: { message?: string };
        message?: string;
      }>('/upload/image', formData);

      if (!response || !response.success) {
        const msg = response?.error?.message || response?.message || 'Failed to upload profile image';
        throw new Error(msg);
      }

      return response.data.url || response.data.key || imageKey;
    } catch (error: any) {
      const message = getErrorMessage(error, 'Failed to upload profile picture. Please try again.');
      logError(error, { context: 'Uploading profile image', message });
      throw new Error(message);
    }
  },

  /**
   * Upload a banner image
   * @param userId The user ID
   * @param file The image file
   * @returns The URL of the uploaded image
   */
  async uploadBannerImage(userId: string, file: File): Promise<string> {
    try {
      // Validate file size client-side first
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size exceeds the 10MB limit. Please choose a smaller image.');
      }

      // Generate a unique key for the image
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const imageKey = `users/${userId}/banner-${timestamp}.${fileExtension}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', imageKey);

      // Upload binary multipart directly to backend API
      const response = await apiClient.post<{
        success: boolean;
        data: { key: string; url: string };
        error?: { message?: string };
        message?: string;
      }>('/upload/image', formData);

      if (!response || !response.success) {
        const msg = response?.error?.message || response?.message || 'Failed to upload banner image';
        throw new Error(msg);
      }

      return response.data.url || response.data.key || imageKey;
    } catch (error: any) {
      const message = getErrorMessage(error, 'Failed to upload banner image. Please try again.');
      logError(error, { context: 'Uploading banner image', message });
      throw new Error(message);
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
            reject(new Error('Failed to process image: Canvas context unavailable'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
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
          reject(new Error('Failed to load image file. The file may be corrupt.'));
        };

        img.src = url;
      } catch (error) {
        reject(error);
      }
    });
  },

  /**
   * Upload an editor image
   * @param file The image file
   * @returns The URL of the uploaded image
   */
  async uploadEditorImage(file: File): Promise<string> {
    try {
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('Image size exceeds the 10MB limit. Please choose a smaller image.');
      }

      // Generate a unique key for the image
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const imageKey = `editor/images/${timestamp}-${Math.random().toString(36).substring(2, 10)}.${fileExtension}`;

      const formData = new FormData();
      formData.append('file', file);
      formData.append('key', imageKey);

      // Upload binary multipart directly to backend API
      const response = await apiClient.post<{
        success: boolean;
        data: { url: string };
        error?: { message?: string };
        message?: string;
      }>('/upload/image', formData);

      if (!response || !response.success || !response.data?.url) {
        const msg = response?.error?.message || response?.message || 'Failed to upload editor image';
        throw new Error(msg);
      }

      return response.data.url;
    } catch (error: any) {
      const message = getErrorMessage(error, 'Failed to upload image into editor. Please try again.');
      logError(error, { context: 'Uploading editor image', message });
      throw new Error(message);
    }
  }
};

