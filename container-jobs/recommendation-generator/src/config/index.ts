/**
 * Configuration management for the recommendation generator
 */

import { config } from 'dotenv';

// Load environment variables
config();

export interface AppConfig {
  database: {
    url: string;
  };
  recommendations: {
    maxRecommendationsPerStory: number;
    similarityThreshold: number;
    excludeSameAuthor: boolean;
  };
  logging: {
    level: string;
  };
  environment: string;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue!;
}

function getEnvNumber(name: string, defaultValue: number): number {
  const value = process.env[name];
  if (!value) return defaultValue;
  
  const parsed = parseFloat(value);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  
  return parsed;
}

function getEnvBoolean(name: string, defaultValue: boolean): boolean {
  const value = process.env[name];
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true';
}

export const appConfig: AppConfig = {
  database: {
    url: getEnvVar('DATABASE_URL'),
  },
  recommendations: {
    maxRecommendationsPerStory: getEnvNumber('MAX_RECOMMENDATIONS_PER_STORY', 10),
    similarityThreshold: getEnvNumber('SIMILARITY_THRESHOLD', 0.1),
    excludeSameAuthor: getEnvBoolean('EXCLUDE_SAME_AUTHOR', false),
  },
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
  },
  environment: getEnvVar('NODE_ENV', 'production'),
};

// Validate configuration
export function validateConfig(): void {
  if (!appConfig.database.url) {
    throw new Error('DATABASE_URL is required');
  }

  if (appConfig.recommendations.maxRecommendationsPerStory <= 0) {
    throw new Error('MAX_RECOMMENDATIONS_PER_STORY must be greater than 0');
  }

  if (appConfig.recommendations.similarityThreshold < 0 || appConfig.recommendations.similarityThreshold > 1) {
    throw new Error('SIMILARITY_THRESHOLD must be between 0 and 1');
  }
}
