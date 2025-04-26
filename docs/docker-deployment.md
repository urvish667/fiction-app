# Docker Deployment Guide for FableSpace

This document provides instructions for containerizing and deploying the FableSpace application using Docker.

## Overview

The FableSpace application consists of two main components:
1. The main Next.js application
2. The notification service

Both components are containerized separately and can be deployed together using Docker Compose.

## Prerequisites

- Docker and Docker Compose installed
- PostgreSQL database (Azure PostgreSQL)
- Redis instance (Azure Redis Cache)
- Azure Blob Storage account

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Database
DATABASE_URL=postgresql://username:password@hostname:port/database

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# Security
JWT_ENCRYPTION_KEY=your-jwt-encryption-key
FINGERPRINT_SECRET=your-fingerprint-secret
CSRF_SECRET=your-csrf-secret
RATE_LIMIT_SECRET=your-rate-limit-secret

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING=your-azure-storage-connection-string
AZURE_STORAGE_CONTAINER_NAME=your-container-name

# Redis (for notification service)
REDIS_URL=rediss://:your-password@your-redis-host:6380
# Or individual components
REDIS_HOST=your-redis-host
REDIS_PORT=6380
REDIS_PASSWORD=your-redis-password
REDIS_TLS=true

# WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:3001/api/ws
WS_PORT=3001

# Email (optional for production)
EMAIL_SERVER_HOST=smtp.example.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-username
EMAIL_SERVER_PASSWORD=your-password
EMAIL_SERVER_SECURE=true
EMAIL_FROM=FableSpace <noreply@yourdomain.com>

# API Keys (if needed)
SCHEDULED_TASKS_API_KEY=your-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret
PAYPAL_WEBHOOK_SECRET=your-paypal-webhook-secret

# Logging
LOG_LEVEL=info
```

## Docker Files

The project includes the following Docker-related files:

1. `Dockerfile` - For the main Next.js application
2. `notification-service/Dockerfile` - For the notification service
3. `docker-compose.yml` - For orchestrating both services
4. `.dockerignore` - To exclude unnecessary files from the Docker build

### Main Application Dockerfile

The main application uses a multi-stage build process to optimize the Docker image size:

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the build output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Set the correct permissions
USER nextjs

# Expose the port
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
```

### Notification Service Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose WebSocket port
EXPOSE 3001

# Start the service
CMD ["npm", "start"]
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - .env
    depends_on:
      - notification-service
    networks:
      - fablespace-network

  notification-service:
    build:
      context: ./notification-service
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    env_file:
      - .env
    restart: unless-stopped
    networks:
      - fablespace-network

networks:
  fablespace-network:
    driver: bridge
```

## Building and Running

### Build and Run with Docker Compose

To build and run both services:

```bash
docker-compose up -d
```

This will:
1. Build both Docker images if they don't exist
2. Create and start containers for both services
3. Create a network for communication between services
4. Mount the `.env` file for both services

### Build and Run Individually

To build and run the main application:

```bash
# Build the image
docker build -t fablespace-app .

# Run the container
docker run -p 3000:3000 --env-file .env fablespace-app
```

To build and run the notification service:

```bash
# Build the image
cd notification-service
docker build -t fablespace-notification-service .

# Run the container
docker run -p 3001:3001 --env-file .env fablespace-notification-service
```

## Production Deployment Considerations

### 1. Environment Variables

In production, you should:
- Use a secure method to manage environment variables
- Consider using Docker secrets or a configuration management system
- Never commit `.env` files to version control

### 2. Database Migration

Before deploying, ensure your database schema is up to date:

```bash
npx prisma migrate deploy
```

### 3. Health Checks

Add health check endpoints to your application and configure Docker to use them:

```yaml
services:
  app:
    # ... other configuration
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### 4. Logging

Configure your application to output logs to stdout/stderr so Docker can capture them:

```bash
# View logs
docker logs fablespace-app
docker logs fablespace-notification-service

# Follow logs
docker logs -f fablespace-app
```

### 5. Container Orchestration

For production deployments, consider using:
- Kubernetes
- Azure Container Apps
- AWS ECS
- Google Cloud Run

These platforms provide additional features like:
- Auto-scaling
- Load balancing
- Rolling updates
- Self-healing

## Troubleshooting

### Common Issues

1. **Container exits immediately**
   - Check logs: `docker logs <container_id>`
   - Ensure environment variables are correctly set

2. **Services can't communicate**
   - Ensure they're on the same network
   - Check that service names are used as hostnames

3. **Database connection issues**
   - Verify DATABASE_URL is correct
   - Ensure the database is accessible from the container

4. **Redis connection issues**
   - Verify Redis configuration
   - Check if TLS is required

### Debugging

To get a shell in a running container:

```bash
docker exec -it <container_id> /bin/sh
```

To view container logs:

```bash
docker logs <container_id>
```

## Maintenance

### Updating Images

When you make changes to your application:

1. Rebuild the images:
   ```bash
   docker-compose build
   ```

2. Restart the containers:
   ```bash
   docker-compose up -d
   ```

### Cleaning Up

To remove unused images and containers:

```bash
docker system prune
```

To remove volumes (warning: this will delete data):

```bash
docker system prune -a --volumes
```
