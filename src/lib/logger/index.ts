/**
 * Logger Service
 *
 * A centralized logging service for structured logging.
 * This service handles different log levels and environments appropriately.
 */

// Define log levels
export enum LogLevel {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

// Define log context type
export type LogContext = Record<string, any>;

// Configure logger based on environment
const isDevelopment = process.env.NODE_ENV !== 'production';
const isTest = process.env.NODE_ENV === 'test';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Log level priorities (higher number = higher priority)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.TRACE]: 0,
  [LogLevel.DEBUG]: 1,
  [LogLevel.INFO]: 2,
  [LogLevel.WARN]: 3,
  [LogLevel.ERROR]: 4,
  [LogLevel.FATAL]: 5,
};

// Get current log level priority
const currentLogLevelPriority = LOG_LEVEL_PRIORITY[logLevel as LogLevel] || LOG_LEVEL_PRIORITY[LogLevel.INFO];

// Check if a log level should be logged based on the current log level
function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_PRIORITY[level] >= currentLogLevelPriority;
}

// Format a log message with timestamp and level
function formatLogMessage(level: LogLevel, message: string, context: LogContext = {}, source?: string): string {
  const timestamp = new Date().toISOString();
  const sourceStr = source ? ` [${source}]` : '';
  return `[${timestamp}] [${level.toUpperCase()}]${sourceStr} ${message}`;
}

// Format context object for logging
function formatContext(context: LogContext): string {
  try {
    return JSON.stringify(context, null, isDevelopment ? 2 : 0);
  } catch (error) {
    return '[Circular or Non-Serializable Data]';
  }
}

/**
 * Logger class that provides a consistent interface for logging
 */
class Logger {
  private source?: string;

  constructor(source?: string) {
    this.source = source;
  }

  /**
   * Create a child logger with a specific source
   */
  child(source: string): Logger {
    return new Logger(source);
  }

  /**
   * Log at trace level
   */
  trace(message: string, context: LogContext = {}): void {
    this.log(LogLevel.TRACE, message, context);
  }

  /**
   * Log at debug level
   */
  debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log at info level
   */
  info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log at warn level
   */
  warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log at error level
   */
  error(message: string | Error, context: LogContext = {}): void {
    const errorMessage = message instanceof Error ? message.message : message;
    const errorStack = message instanceof Error ? message.stack : undefined;
    const errorName = message instanceof Error ? message.name : undefined;

    this.log(
      LogLevel.ERROR,
      errorMessage,
      {
        ...context,
        ...(errorStack && { stack: errorStack }),
        ...(errorName && { errorName }),
      }
    );
  }

  /**
   * Log at fatal level
   */
  fatal(message: string | Error, context: LogContext = {}): void {
    const errorMessage = message instanceof Error ? message.message : message;
    const errorStack = message instanceof Error ? message.stack : undefined;
    const errorName = message instanceof Error ? message.name : undefined;

    this.log(
      LogLevel.FATAL,
      errorMessage,
      {
        ...context,
        ...(errorStack && { stack: errorStack }),
        ...(errorName && { errorName }),
      }
    );
  }

  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, context: LogContext = {}): void {
    // In browser environments, don't log in production unless explicitly enabled
    if (typeof window !== 'undefined' &&
        process.env.NODE_ENV === 'production' &&
        process.env.NEXT_PUBLIC_ENABLE_CLIENT_LOGS !== 'true') {
      return;
    }

    // Check if this log level should be logged
    if (!shouldLog(level)) {
      return;
    }

    const logData = {
      ...context,
      ...(this.source && { source: this.source }),
    };

    const formattedMessage = formatLogMessage(level, message, logData, this.source);
    const formattedContext = Object.keys(logData).length > 0 ? formatContext(logData) : '';

    // Log to console based on level
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        if (isDevelopment) {
          console.debug(formattedMessage, formattedContext);
        }
        break;
      case LogLevel.INFO:
        console.info(formattedMessage, formattedContext);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, formattedContext);
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(formattedMessage, formattedContext);
        break;
    }

    // In production, you would integrate with external logging services here
    // For example, sending logs to a service like Datadog, LogRocket, or Sentry
    if (process.env.NODE_ENV === 'production') {
      // Example integration with external logging service:
      // if (level === LogLevel.ERROR || level === LogLevel.FATAL) {
      //   captureException(message, context);
      // } else {
      //   captureMessage(message, { level, ...context });
      // }
    }
  }
}

// Export a default logger instance
export const logger = new Logger('app');

// Export the Logger class for creating scoped loggers
export default Logger;
