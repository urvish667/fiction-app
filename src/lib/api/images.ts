import { apiClient } from "@/lib/apiClient";

/**
 * Image API service for handling image URLs and operations
 * Provides direct access to backend images without proxy routing
 */
export const ImageService = {
  /**
   * Get the full URL for an image stored in the backend
   * @param imageInput The image key/path or full URL
   * @returns Full URL to the image on the backend API or CDN
   */
  getImageUrl: (imageInput?: string | null): string | null => {
    if (!imageInput) return null;

    // If it's already a full URL (starts with http), return as-is
    if (imageInput.startsWith('http://') || imageInput.startsWith('https://')) {
      return imageInput;
    }

    const apiPrefix = '/api/v1/images/';

    // If it's a local path (starts with /) but not our API prefix, return as-is
    // This handles static assets like /placeholder.svg
    if (imageInput.startsWith('/') && !imageInput.startsWith(apiPrefix)) {
      return imageInput;
    }

    let imageKey = imageInput;

    // Check if it's a full API path (backend proxy URL from database)
    if (imageInput.startsWith(apiPrefix)) {
      // Extract the key part after the prefix and decode it
      const encodedKey = imageInput.substring(apiPrefix.length);
      imageKey = decodeURIComponent(encodedKey);

      // In production, use CDN directly for better performance
      // In development, keep using backend proxy (localhost:4000)
      if (process.env.NODE_ENV === 'production') {
        const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.fablespace.space';
        // Remove trailing slash from CDN URL if present
        const cleanCdnUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
        return `${cleanCdnUrl}/${imageKey}`;
      }
      // In development, return the proxy URL as-is
      return imageInput;
    }

    // Otherwise, construct the URL from the image key
    const baseUrl = process.env.NODE_ENV === 'development'
      ? '' // Use relative URLs in development (proxied through Next.js)
      : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.fablespace.com/api/v1');
    return `${baseUrl}/api/v1/images/${encodeURIComponent(imageKey)}`;
  },

  /**
   * Get multiple image URLs for a list of image keys
   * @param imageKeys Array of image keys
   * @returns Array of full image URLs
   */
  getImageUrls: (imageKeys: (string | null)[]): (string | null)[] => {
    return imageKeys.map(key => ImageService.getImageUrl(key));
  },

  /**
   * Get a fallback image URL for when an image fails to load
   * @returns URL to a placeholder image
   */
  getFallbackImageUrl: (): string => {
    // You can customize this to point to a default placeholder
    return '/placeholder.svg';
  },

  /**
   * Construct an image URL with specific dimensions/transformations
   * This can be extended in the future for image resizing/cropping
   * @param imageKey The image key
   * @param options Size/transformation options
   * @returns URL with query parameters for transformations
   */
  getTransformedImageUrl: (
    imageKey: string | null,
    options?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpg' | 'webp' | 'png';
    }
  ): string | null => {
    const baseUrl = ImageService.getImageUrl(imageKey);
    if (!baseUrl || !options) return baseUrl;

    const params = new URLSearchParams();
    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format) params.append('f', options.format);

    return `${baseUrl}?${params.toString()}`;
  },

  /**
   * Upload an image to the backend (delegates to existing upload logic)
   * This is kept for consistency but uploads use different endpoints
   * @param imageData The image file or data to upload
   * @returns Upload result with URL
   */
  /**
   * Upload an image to the backend
   * @param imageData The image file to upload
   * @param metadata Optional metadata including custom key
   * @returns Upload result with URL
   */
  async uploadImage(imageData: File, metadata?: {
    key?: string;
  }): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await imageData.arrayBuffer();

      // Generate key if not provided
      let imageKey = metadata?.key;
      if (!imageKey) {
        const timestamp = Date.now();
        const fileExtension = imageData.name.split('.').pop() || 'jpg';
        imageKey = `uploads/${timestamp}.${fileExtension}`;
      }

      // Prepare payload matching backend expectation: { key, contentType, data: number[] }
      const payload = {
        key: imageKey,
        contentType: imageData.type,
        data: Array.from(new Uint8Array(arrayBuffer))
      };

      const response = await apiClient.post<{
        success: boolean;
        data: { url: string };
        error?: string;
      }>('/upload/image', payload);

      if (response.success && response.data?.url) {
        return {
          success: true,
          url: response.data.url
        };
      } else {
        return {
          success: false,
          error: response.error || 'Failed to upload image'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to upload image'
      };
    }
  }
};

export default ImageService;
