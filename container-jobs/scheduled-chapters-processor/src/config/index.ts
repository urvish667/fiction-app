/**
 * Configuration management for the scheduled chapters processor
 */

import { config } from 'dotenv';

// Load environment variables
config();

export interface AppConfig {
  database: {
    url: string;
  };
  logging: {
    level: string;
  };
  environment: string;
}

export const appConfig: AppConfig = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  environment: process.env.NODE_ENV || 'production',
};

/**
 * Validates the configuration and throws an error if required values are missing
 */
export function validateConfig(): void {
  const errors: string[] = [];

  if (!appConfig.database.url) {
    errors.push('DATABASE_URL is required');
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
