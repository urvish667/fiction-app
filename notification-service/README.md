# FableSpace Notification Service

This is a standalone service for handling real-time notifications in the FableSpace application. It uses Redis for pub/sub messaging and WebSockets for real-time client communication.

## Features

- Real-time notifications via WebSockets
- Delayed notifications via BullMQ and Redis
- Fallback to in-memory queue when Redis is unavailable
- Authentication via JWT tokens
- Reconnection handling for WebSocket clients

## Architecture

The notification service consists of:

1. **Redis Client**: Handles connection to Redis for pub/sub and queue management
2. **WebSocket Server**: Handles real-time communication with clients
3. **Notification Queue**: Processes delayed notifications using BullMQ
4. **Authentication**: Verifies client identity using JWT tokens

## Setup

### Prerequisites

- Node.js 18+
- Redis server (or Azure Redis Cache)

### Environment Variables

Create a `.env` file with the following variables:

```
# Redis Configuration - Option 1: Using URL
REDIS_URL=rediss://:your-password@fablespace-test-redis.redis.cache.windows.net:6380

# Redis Configuration - Option 2: Using individual components
REDIS_HOST=fablespace-test-redis.redis.cache.windows.net
REDIS_PORT=6380
REDIS_PASSWORD=your-password
REDIS_TLS=true

# WebSocket Configuration
WS_PORT=3001

# JWT Configuration
JWT_ENCRYPTION_KEY=your-jwt-encryption-key
```

### Installation

```bash
npm install
```

### Running the Service

```bash
npm start
```

## Usage

The notification service exposes a WebSocket server that clients can connect to. Clients need to provide a JWT token for authentication.

### Client Connection

```javascript
const ws = new WebSocket('ws://localhost:3001/api/ws?token=your-jwt-token');
```

### Message Format

Messages sent to clients follow this format:

```json
{
  "type": "notification",
  "data": {
    "id": "notification-id",
    "userId": "user-id",
    "type": "notification-type",
    "title": "Notification Title",
    "message": "Notification message",
    "content": {},
    "read": false,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

## Docker

The service can be run in a Docker container. See the `Dockerfile` for details.

```bash
docker build -t fablespace-notification-service .
docker run -p 3001:3001 --env-file .env fablespace-notification-service
```
