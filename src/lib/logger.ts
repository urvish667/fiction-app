/**
 * Legacy logger module - now redirects to the new logger implementation
 * @deprecated Use the new logger from './logger/index.ts' instead
 */

import { logger as newLogger } from './logger/index';

// Create a legacy logger that forwards to the new implementation
class LegacyLogger {
  debug(message: string, ...args: any[]): void {
    newLogger.debug(message, this.argsToContext(args));
  }

  info(message: string, ...args: any[]): void {
    newLogger.info(message, this.argsToContext(args));
  }

  warn(message: string, ...args: any[]): void {
    newLogger.warn(message, this.argsToContext(args));
  }

  error(message: string | Error, ...args: any[]): void {
    if (message instanceof Error) {
      newLogger.error(message, this.argsToContext(args));
    } else {
      newLogger.error(message, this.argsToContext(args));
    }
  }

  // Add child method to support the new logger API
  child(source: string): LegacyLogger {
    return this;
  }

  // Convert old-style args to new context object
  private argsToContext(args: any[]): Record<string, any> {
    if (args.length === 0) return {};
    if (args.length === 1 && typeof args[0] === 'object') return args[0];
    return { args };
  }
}

// Export the legacy logger for backward compatibility
export const logger = new LegacyLogger();
