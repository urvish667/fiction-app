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

    const trimmed = imageInput.trim();
    if (!trimmed) return null;

    // Full external URLs or static local assets (/placeholder.svg) are returned as-is
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    if (trimmed.startsWith('/') && !trimmed.includes('api/v1/images/')) return trimmed;

    // Clean key (strip proxy prefix if any)
    let key = trimmed;
    if (key.includes('api/v1/images/')) {
      key = key.substring(key.indexOf('api/v1/images/') + 'api/v1/images/'.length);
    }
    key = key.replace(/^\/+/, '');

    const rawBaseUrl = process.env.NODE_ENV === 'development'
      ? ''
      : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.fablespace.space/api/v1');

    const baseOrigin = rawBaseUrl.replace(/\/api\/v1\/?$/, '');

    return `${baseOrigin}/api/v1/images/${key}`;
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
   * Upload an image to the backend using FormData multipart upload
   * @param imageData The image file to upload
   * @param metadata Optional metadata including custom key
   * @returns Upload result with URL and detailed error message if failed
   */
  async uploadImage(imageData: File, metadata?: {
    key?: string;
  }): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      if (imageData.size > 10 * 1024 * 1024) {
        return {
          success: false,
          error: 'Image size exceeds the 10MB limit. Please choose a smaller image.',
        };
      }

      // Generate key if not provided
      let imageKey = metadata?.key;
      if (!imageKey) {
        const timestamp = Date.now();
        const fileExtension = imageData.name.split('.').pop() || 'jpg';
        imageKey = `uploads/${timestamp}.${fileExtension}`;
      }

      const formData = new FormData();
      formData.append('file', imageData);
      formData.append('key', imageKey);

      const response = await apiClient.post<{
        success: boolean;
        data: { key: string; url: string };
        error?: { message?: string };
        message?: string;
      }>('/upload/image', formData);

      if (response && response.success && response.data?.url) {
        return {
          success: true,
          url: response.data.url,
        };
      } else {
        const errorMsg = response?.error?.message || response?.message || 'Failed to upload image';
        return {
          success: false,
          error: errorMsg,
        };
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to upload image. Please check your connection and try again.';

      return {
        success: false,
        error: errorMsg,
      };
    }
  }
};

export default ImageService;

