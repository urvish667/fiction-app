/**
 * External Donation Handler
 * 
 * This module provides functionality for redirecting users to external donation platforms
 * (Buy Me a Coffee and Ko-fi) with appropriate tracking parameters.
 */

/**
 * Handles redirecting users to external donation platforms
 * 
 * @param platform - The external platform ('buymeacoffee' or 'kofi')
 * @param username - The author's username on the external platform
 * @param storyId - Optional story ID to associate with the donation
 * @param storySlug - Optional story slug for better tracking
 * @param storyTitle - Optional story title for display on the external platform
 */
export function handleExternalDonation(
  platform: 'buymeacoffee' | 'kofi',
  username: string,
  storyId?: string,
  storySlug?: string,
  storyTitle?: string
): void {
  // Base URLs for each platform
  const baseUrls = {
    buymeacoffee: 'https://www.buymeacoffee.com',
    kofi: 'https://ko-fi.com'
  };
  
  // Construct the base URL with username
  let url = `${baseUrls[platform]}/${username}`;
  
  // Add tracking parameters for analytics
  const params = new URLSearchParams();
  params.append('source', 'fablespace');
  
  // Add story information if available
  if (storyId) {
    params.append('storyId', storyId);
  }
  
  if (storySlug) {
    params.append('storySlug', storySlug);
  }
  
  // Platform-specific parameters
  if (platform === 'buymeacoffee') {
    // BMC supports a 'thank_you_url' parameter for redirecting after donation
    const thankYouUrl = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/donate/success`);
    if (storyId) thankYouUrl.searchParams.append('storyId', storyId);
    params.append('thank_you_url', thankYouUrl.toString());
    
    // Add message with story title if available
    if (storyTitle) {
      params.append('message', `Support for "${storyTitle}"`);
    }
  } else if (platform === 'kofi') {
    // Ko-fi specific parameters
    if (storyTitle) {
      params.append('title', `Support for "${storyTitle}"`);
    }
  }
  
  // Append parameters to URL
  url = `${url}?${params.toString()}`;
  
  // Open in new tab
  window.open(url, '_blank');
  
  // Track this donation click event
  trackDonationClick({
    platform,
    username,
    storyId,
    storySlug
  });
}

/**
 * Tracks donation button clicks for analytics
 * 
 * @param data - Tracking data including platform, username, and story information
 */
export function trackDonationClick(data: {
  platform: string;
  username: string;
  storyId?: string;
  storySlug?: string;
}): void {
  // This is a placeholder for actual analytics tracking
  // In a real implementation, this would send data to an analytics service
  
  console.log('Donation click tracked:', data);
  
  // Example implementation with a hypothetical analytics service:
  // analytics.track('donation_button_click', {
  //   platform: data.platform,
  //   username: data.username,
  //   storyId: data.storyId,
  //   storySlug: data.storySlug,
  //   timestamp: new Date().toISOString()
  // });
  
  // You could also send this data to your backend for tracking
  try {
    fetch('/api/analytics/donation-click', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        timestamp: new Date().toISOString()
      }),
    });
  } catch (error) {
    // Silently fail if analytics tracking fails
    console.error('Failed to track donation click:', error);
  }
}