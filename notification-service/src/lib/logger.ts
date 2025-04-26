import pino from 'pino';

// Configure logger
const logLevel = process.env.LOG_LEVEL || 'info';

// Create logger instance
export const logger = pino({
  level: logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
    },
  },
});

export default logger;
