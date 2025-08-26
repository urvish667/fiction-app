/**
 * Safely decodes a URI component without throwing an error on malformed input.
 * @param component The URI component to decode.
 * @returns The decoded component, or null if decoding fails.
 */
export function safeDecodeURIComponent(component: string): string | null {
  try {
    return decodeURIComponent(component);
  } catch (e) {
    // Log the error for debugging purposes
    console.error("Failed to decode URI component:", component, e);
    // Return null if it's malformed
    return null;
  }
}
