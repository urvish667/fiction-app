/**
 * Client Logger
 *
 * A browser-safe version of the logger that doesn't log to the console
 * in production unless explicitly enabled.
 */

import { LogLevel, LogContext } from './index';

// Format context object for logging
function formatContext(context: LogContext): string {
  try {
    return JSON.stringify(context, null, 2);
  } catch (error) {
    return '[Circular or Non-Serializable Data]';
  }
}

/**
 * Client-side logger that respects production settings
 */
class ClientLogger {
  private source?: string;
  private isDevelopment = process.env.NODE_ENV !== 'production';

  constructor(source?: string) {
    this.source = source;
  }

  /**
   * Create a child logger with a specific source
   */
  child(source: string): ClientLogger {
    return new ClientLogger(source);
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
    // In production, don't log to console unless explicitly enabled
    if (!this.isDevelopment && process.env.NEXT_PUBLIC_ENABLE_CLIENT_LOGS !== 'true') {
      return;
    }

    // Only log errors and warnings in production by default
    if (!this.isDevelopment &&
        level !== LogLevel.ERROR &&
        level !== LogLevel.FATAL &&
        level !== LogLevel.WARN) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logData = {
      ...context,
      ...(this.source && { source: this.source }),
    };

    // Format the log message
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]${this.source ? ` [${this.source}]` : ''} ${message}`;
    const formattedContext = Object.keys(logData).length > 0 ? formatContext(logData) : '';

    // Only log in browser environments
    if (typeof window !== 'undefined') {
      switch (level) {
        case LogLevel.TRACE:
        case LogLevel.DEBUG:
          console.debug(formattedMessage, formattedContext);
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
    }
  }
}

// Export a default client logger instance
export const clientLogger = new ClientLogger('client');

// Export the ClientLogger class for creating scoped loggers
export default ClientLogger;
