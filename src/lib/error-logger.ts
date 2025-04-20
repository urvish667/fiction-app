/**
 * Centralized error logging utility
 * In production, this would integrate with services like Sentry
 */

// Define a more specific type for context with common fields
type ErrorContext = {
  context?: string;
  userId?: string;
  storyId?: string;
  chapterId?: string;
  component?: string;
  action?: string;
  [key: string]: any;
};

// Error severity levels
export enum LogSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug'
}

// Timestamp formatter
const getTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Core logging function that handles all log types
 * @param severity The severity level of the log
 * @param message The message to log
 * @param error Optional error object
 * @param context Additional context information
 */
const logWithSeverity = (
  severity: LogSeverity,
  message: string,
  error?: unknown,
  context: ErrorContext = {}
): void => {
  const timestamp = getTimestamp();
  const errorDetails = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack
  } : error;

  const logData = {
    timestamp,
    severity,
    message,
    error: errorDetails,
    ...context,
    environment: process.env.NODE_ENV
  };

  // In development, log to console
  if (process.env.NODE_ENV !== 'production') {
    switch (severity) {
      case LogSeverity.ERROR:
        console.error(`[${timestamp}] Error: ${message}`, logData);
        break;
      case LogSeverity.WARNING:
        console.warn(`[${timestamp}] Warning: ${message}`, logData);
        break;
      case LogSeverity.INFO:
        console.info(`[${timestamp}] Info: ${message}`, logData);
        break;
      case LogSeverity.DEBUG:
        console.debug(`[${timestamp}] Debug: ${message}`, logData);
        break;
    }
    return;
  }

  // In production, integrate with monitoring services
  // Example Sentry integration:
  // if (typeof window !== 'undefined' && window.Sentry) {
  //   if (severity === LogSeverity.ERROR && error) {
  //     window.Sentry.captureException(error, { extra: context });
  //   } else {
  //     window.Sentry.captureMessage(message, {
  //       level: severity,
  //       extra: context
  //     });
  //   }
  // }

  // For now, still log to console in production, but you'd remove this in a real implementation
  switch (severity) {
    case LogSeverity.ERROR:
      console.error(`[${timestamp}] Error: ${message}`, logData);
      break;
    case LogSeverity.WARNING:
      console.warn(`[${timestamp}] Warning: ${message}`, logData);
      break;
    case LogSeverity.INFO:
      if (process.env.NEXT_PUBLIC_ENABLE_PROD_LOGS === 'true') {
        console.info(`[${timestamp}] Info: ${message}`, logData);
      }
      break;
    case LogSeverity.DEBUG:
      if (process.env.NEXT_PUBLIC_ENABLE_PROD_LOGS === 'true') {
        console.debug(`[${timestamp}] Debug: ${message}`, logData);
      }
      break;
  }
};

/**
 * Log an error with optional context information
 * @param error The error object or message
 * @param context Additional context information about where/why the error occurred
 */
export const logError = (error: unknown, context: ErrorContext = {}): void => {
  const errorMessage = error instanceof Error
    ? error.message
    : String(error);

  logWithSeverity(LogSeverity.ERROR, errorMessage, error, context);
};

/**
 * Log a warning with optional context information
 * @param message The warning message
 * @param context Additional context information
 */
export const logWarning = (message: string, context: ErrorContext = {}): void => {
  logWithSeverity(LogSeverity.WARNING, message, undefined, context);
};

/**
 * Log information with optional context
 * @param message The info message
 * @param context Additional context information
 */
export const logInfo = (message: string, context: ErrorContext = {}): void => {
  logWithSeverity(LogSeverity.INFO, message, undefined, context);
};

/**
 * Log debug information with optional context
 * @param message The debug message
 * @param context Additional context information
 */
export const logDebug = (message: string, context: ErrorContext = {}): void => {
  logWithSeverity(LogSeverity.DEBUG, message, undefined, context);
};
