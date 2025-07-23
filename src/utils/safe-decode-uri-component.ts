/**
 * Safely decodes a URI component without throwing an error on malformed input.
 * @param component The URI component to decode.
 * @returns The decoded component, or the original component if decoding fails.
 */
export function safeDecodeURIComponent(component: string): string {
  try {
    return decodeURIComponent(component);
  } catch (e) {
    // Log the error for debugging purposes
    console.error("Failed to decode URI component:", component, e);
    // Return the original component if it's malformed
    return component;
  }
}
