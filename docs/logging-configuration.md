# Logging Configuration for FableSpace

This document explains how to configure logging for the FableSpace application.

## Environment Variables

The following environment variables can be used to configure logging behavior:

### Server-side Logging

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `LOG_LEVEL` | The minimum log level to record | `info` in production, `debug` in development | `trace`, `debug`, `info`, `warn`, `error`, `fatal` |
| `DISABLE_CONSOLE_LOGS` | Disable console logs in production | `false` | `true` |
| `API_DEBUG` | Enable API request/response logging even in production | `false` | `true` |

### Client-side Logging

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_ENABLE_CLIENT_LOGS` | Enable client-side logs in production | `false` | `true` |

## Log Levels

The application uses the following log levels, in order of increasing severity:

1. `trace` - Very detailed information, useful for debugging specific issues
2. `debug` - Detailed information useful during development
3. `info` - General information about application operation
4. `warn` - Warning conditions that don't affect normal operation
5. `error` - Error conditions that affect operation but don't crash the application
6. `fatal` - Severe error conditions that may cause the application to crash

In production, only `info` level and above are logged by default.

## Logging in Development

In development mode, logs are formatted with colors and timestamps for better readability. All log levels are enabled.

## Logging in Production

In production mode:

1. Only `info` level and above are logged by default
2. Client-side logs are disabled by default
3. Logs are structured as JSON for better integration with log aggregation services

## Integration with External Logging Services

The logging system is designed to be easily integrated with external logging services like Datadog, LogRocket, or Sentry.

To integrate with an external service, modify the logger implementation in `src/lib/logger/index.ts` to send logs to your preferred service.

## Best Practices

1. Use the appropriate log level for each message
2. Include relevant context with each log message
3. Don't log sensitive information
4. Use structured logging (objects) rather than string concatenation
5. Create child loggers for specific components or features

## Example Usage

```typescript
import { logger } from '@/lib/logger';

// Create a component-specific logger
const componentLogger = logger.child('my-component');

// Log at different levels
componentLogger.debug('Initializing component', { props });
componentLogger.info('Component mounted');
componentLogger.warn('Deprecated feature used', { feature: 'oldFeature' });
componentLogger.error('Failed to load data', { error });
```
