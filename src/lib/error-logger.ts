/**
 * Centralized error logging utility
 * In production, this would integrate with services like Sentry
 */

type ErrorContext = Record<string, any>;

/**
 * Log an error with optional context information
 * @param error The error object or message
 * @param context Additional context information about where/why the error occurred
 */
export const logError = (error: unknown, context: ErrorContext = {}) => {
  // Format the error message
  const errorMessage = error instanceof Error 
    ? error.message 
    : String(error);
  
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`Error: ${errorMessage}`, {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      ...context
    });
    return;
  }
  
  // In production, you would send this to Sentry or similar service
  // This is where you would integrate with Sentry, LogRocket, etc.
  // Example Sentry integration:
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
  
  // For now, still log to console in production, but you'd remove this in a real implementation
  console.error(`Error: ${errorMessage}`, {
    ...context,
    environment: process.env.NODE_ENV
  });
};

/**
 * Log a warning with optional context information
 */
export const logWarning = (message: string, context: ErrorContext = {}) => {
  // Log to console in development
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`Warning: ${message}`, context);
    return;
  }
  
  // In production, you might want to send warnings to your monitoring service as well
  // For now, still log to console
  console.warn(`Warning: ${message}`, {
    ...context,
    environment: process.env.NODE_ENV
  });
};

/**
 * Log information with optional context
 */
export const logInfo = (message: string, context: ErrorContext = {}) => {
  // Only log in development or if explicitly enabled in production
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_ENABLE_PROD_LOGS === 'true') {
    console.log(`Info: ${message}`, context);
  }
};
