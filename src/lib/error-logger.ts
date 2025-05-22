/**
 * Centralized error logging utility
 * Uses the application's logger service for consistent logging
 */

import { logger } from './logger';
import type { LogContext } from './logger/index';

// Define a more specific type for context with common fields
type ErrorContext = LogContext & {
  context?: string;
  userId?: string;
  storyId?: string;
  chapterId?: string;
  component?: string;
  action?: string;
};

// Error severity levels (kept for backward compatibility)
export enum LogSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  DEBUG = 'debug'
}

// Create a dedicated error logger instance
const errorLogger = logger.child('error-logger');

/**
 * Log an error with optional context information
 * @param error The error object or message
 * @param context Additional context information about where/why the error occurred
 */
export const logError = (error: unknown, context: ErrorContext = {}): void => {
  let message: string;
  let additionalContext: Record<string, any> = {};

  if (error instanceof Error) {
    message = error.message;
    additionalContext = {
      stack: error.stack,
      errorName: error.name
    };
  } else if (typeof error === 'object' && error !== null) {
    // Handle error objects from API responses
    const errorObj = error as any;
    message = errorObj.error || errorObj.message || JSON.stringify(error);
    additionalContext = {
      errorObject: error
    };
  } else {
    message = String(error);
  }

  errorLogger.error(message, {
    ...context,
    ...additionalContext
  });
};

/**
 * Log a warning with optional context information
 * @param message The warning message
 * @param context Additional context information
 */
export const logWarning = (message: string, context: ErrorContext = {}): void => {
  errorLogger.warn(message, context);
};

/**
 * Log information with optional context
 * @param message The info message
 * @param context Additional context information
 */
export const logInfo = (message: string, context: ErrorContext = {}): void => {
  errorLogger.info(message, context);
};

/**
 * Log debug information with optional context
 * @param message The debug message
 * @param context Additional context information
 */
export const logDebug = (message: string, context: ErrorContext = {}): void => {
  errorLogger.debug(message, context);
};
