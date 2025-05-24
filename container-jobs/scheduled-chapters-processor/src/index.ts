/**
 * Main entry point for the scheduled chapters processor container job
 */

import { ScheduledChaptersService } from "./services/scheduled-chapters-service";
import { logger } from "./utils/logger";
import { appConfig, validateConfig } from "./config";

// Global error handlers
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

// Graceful shutdown handler
let isShuttingDown = false;
const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    logger.warn('Force shutdown initiated');
    process.exit(1);
  }

  isShuttingDown = true;
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  
  // Give the application 30 seconds to shut down gracefully
  setTimeout(() => {
    logger.error('Graceful shutdown timeout. Force exiting...');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

/**
 * Main function to run the scheduled chapters processing
 */
async function main(): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Validate configuration
    logger.info('Validating configuration...');
    validateConfig();
    logger.info('Configuration validated successfully');

    // Log configuration (without sensitive data)
    logger.info('Starting scheduled chapters processor with configuration', {
      environment: appConfig.environment,
      logLevel: appConfig.logging.level,
    });

    // Initialize and run the scheduled chapters service
    const scheduledChaptersService = new ScheduledChaptersService();
    
    try {
      const result = await scheduledChaptersService.processScheduledChapters();
      
      const duration = Date.now() - startTime;
      logger.info(`Scheduled chapters processing completed successfully in ${duration}ms`, {
        publishedChapters: result.publishedChapters,
        updatedStories: result.updatedStories,
      });
      
      // Clean up
      await scheduledChaptersService.cleanup();
      
      // Exit successfully
      process.exit(0);
    } catch (error) {
      logger.error('Error during scheduled chapters processing', { 
        error: error instanceof Error ? error.message : error 
      });
      
      // Attempt cleanup
      try {
        await scheduledChaptersService.cleanup();
      } catch (cleanupError) {
        logger.error('Error during cleanup', { 
          error: cleanupError instanceof Error ? cleanupError.message : cleanupError 
        });
      }
      
      throw error;
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Scheduled chapters processing failed after ${duration}ms`, { 
      error: error instanceof Error ? error.message : error 
    });
    
    process.exit(1);
  }
}

// Health check endpoint for container orchestration
if (process.argv.includes('--health-check')) {
  logger.info('Health check requested');
  console.log('OK');
  process.exit(0);
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    logger.error('Fatal error in main function', { 
      error: error instanceof Error ? error.message : error 
    });
    process.exit(1);
  });
}
