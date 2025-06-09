/**
 * Utility functions for handling profile completion requirements on the frontend
 */

import { useRouter } from 'next/navigation';

export interface ProfileIncompleteError {
  error: string;
  message: string;
  code: string;
  redirectTo: string;
}

/**
 * Check if an API error response indicates profile is incomplete
 */
export function isProfileIncompleteError(error: any): error is ProfileIncompleteError {
  return error && 
         error.code === 'PROFILE_INCOMPLETE' && 
         error.redirectTo === '/complete-profile';
}

/**
 * Handle profile incomplete errors by redirecting to profile completion page
 * with the current page as callback URL
 */
export function handleProfileIncompleteError(error: ProfileIncompleteError, currentPath?: string) {
  // Build the profile completion URL with callback
  const completeProfileUrl = new URL('/complete-profile', window.location.origin);
  if (currentPath) {
    completeProfileUrl.searchParams.set('callbackUrl', currentPath);
  }

  // Redirect to profile completion page
  window.location.href = completeProfileUrl.toString();
}

/**
 * Wrapper function for API calls that automatically handles profile incomplete errors
 */
export async function apiCallWithProfileCheck<T>(
  apiCall: () => Promise<Response>,
  currentPath?: string
): Promise<T> {
  try {
    const response = await apiCall();
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Check if it's a profile incomplete error
      if (response.status === 403 && isProfileIncompleteError(errorData)) {
        handleProfileIncompleteError(errorData, currentPath);
        throw new Error('Profile completion required');
      }
      
      // For other errors, throw with the error data
      throw new Error(errorData.error || errorData.message || 'API call failed');
    }
    
    return await response.json();
  } catch (error) {
    // Re-throw the error for the caller to handle
    throw error;
  }
}

/**
 * React hook for handling profile completion in components
 */
export function useProfileCompletionHandler() {
  const router = useRouter();
  
  const handleApiError = (error: any, currentPath?: string) => {
    if (isProfileIncompleteError(error)) {
      const completeProfileUrl = new URL('/complete-profile', window.location.origin);
      if (currentPath) {
        completeProfileUrl.searchParams.set('callbackUrl', currentPath);
      }
      router.push(completeProfileUrl.toString());
      return true; // Indicates the error was handled
    }
    return false; // Indicates the error was not handled
  };
  
  const makeApiCall = async <T>(
    apiCall: () => Promise<Response>,
    currentPath?: string
  ): Promise<T> => {
    return apiCallWithProfileCheck<T>(apiCall, currentPath);
  };
  
  return {
    handleApiError,
    makeApiCall,
    isProfileIncompleteError,
  };
}
