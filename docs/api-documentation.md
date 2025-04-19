# API Documentation

## Authentication
All protected endpoints require authentication either via:
- Session token (for browser-based client requests)
- API key (for server-to-server communication)

Include authentication using one of these methods:
```http
# For API key authentication
x-api-key: your-api-key-here

# For session-based authentication
Cookie: next-auth.session-token=<token>
```

## Endpoints

### Scheduled Tasks
**POST `/api/scheduled-tasks`**
Triggers scheduled tasks execution.

Required headers:
- `authorization: Bearer <api-key>`

Request body:
```json
{
  "tasks": ["all"] // or ["publishScheduledChapters"]
}
```

Response:
```json
{
  "success": true,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "results": {
    "publishScheduledChapters": {
      "publishedChaptersCount": 5,
      "updatedStoriesCount": 3
    }
  }
}
```

### Image Management
**GET `/api/images/[...key]`**
Serves images from S3 storage.

Parameters:
- `key`: Image path segments

Response:
- Redirects to signed S3 URL
- URL expires in 1 hour

**POST `/api/upload-image`**
Uploads an image to S3 storage.

Authentication required: Yes (session)

Request body:
```json
{
  "key": "string",
  "data": "ArrayBuffer",
  "contentType": "string"
}
```

Response:
```json
{
  "url": "string"
}
```

### Stories
**GET `/api/stories/most-viewed`**
Fetches most viewed stories.

Query parameters:
- `limit`: Number of stories to return (optional)

Response:
```json
{
  "stories": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "coverImage": "string",
      "viewCount": number,
      "likeCount": number,
      "author": {
        "id": "string",
        "name": "string"
      }
    }
  ]
}
```

### Dashboard
**GET `/api/dashboard/overview`**
Fetches dashboard overview data.

Authentication required: Yes (session)

Query parameters:
- `timeRange`: "7days" | "30days" | "90days" | "year" | "all"

Response:
```json
{
  "stats": {
    "totalReads": number,
    "totalLikes": number,
    "totalComments": number,
    "totalFollowers": number
  },
  "topStories": [...],
  "chartData": {
    "reads": [...],
    "engagement": [...],
    "earnings": [...]
  }
}
```

**GET `/api/dashboard/stats`**
Fetches specific dashboard statistics.

Authentication required: Yes (session)

Query parameters:
- `timeRange`: "7days" | "30days" | "90days" | "year" | "all"

### Notifications
**GET `/api/notifications`**
Fetches user notifications.

Authentication required: Yes (session)

Query parameters:
- `page`: number (optional)
- `limit`: number (optional)
- `status`: "unread" | "read" | "all" (optional)

**PUT `/api/notifications/mark-read`**
Marks notifications as read.

Authentication required: Yes (session)

Request body:
```json
{
  "ids": ["string"]
}
```

**DELETE `/api/notifications/:id`**
Deletes a notification.

Authentication required: Yes (session)

**POST `/api/notifications/test`**
Creates a test notification (development only).

Authentication required: Yes (session)

Request body:
```json
{
  "type": "string",
  "title": "string",
  "message": "string",
  "data": object,
  "delay": number
}
```

### Payment Processing
**Stripe Webhook: POST `/api/webhooks/stripe`**
Handles Stripe payment events.

Required headers:
- `stripe-signature: <signature>`

**PayPal Webhook: POST `/api/webhooks/paypal`**
Handles PayPal payment events.

## Error Responses
All endpoints may return these error responses:

401 Unauthorized:
```json
{
  "error": "Unauthorized"
}
```

400 Bad Request:
```json
{
  "error": "Error message describing the issue"
}
```

500 Internal Server Error:
```json
{
  "error": "Internal server error"
}
```

## Rate Limiting
- API requests are limited to 100 requests per minute per IP address
- Webhook endpoints have separate rate limiting rules

## Environment Variables Required
```env
API_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
SCHEDULED_TASKS_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_SECRET=
```