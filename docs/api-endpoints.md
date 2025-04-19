# API Endpoints Documentation

## Authentication
### `/api/auth/[...nextauth]`
NextAuth.js authentication handling

### `/api/auth/signup`
**POST**
- Purpose: Register a new user
- Body:
  ```typescript
  {
    email?: string;
    username: string;
    // other signup fields
  }
  ```
- Validation: Checks for email and username availability

## Dashboard
### `/api/dashboard/overview`
**GET**
- Purpose: Fetches all dashboard data
- Query Parameters:
  - `timeRange`: "7days" | "30days" | "90days" | "year" | "all"

### `/api/dashboard/stats`
**GET**
- Purpose: Fetches dashboard statistics
- Query Parameters:
  - `timeRange`: string

### `/api/dashboard/stories`
**GET**
- Purpose: Fetches top performing stories
- Query Parameters:
  - `limit`: number (default: 5)
  - `sortBy`: "reads" | "likes" | "comments" | "earnings"

### `/api/dashboard/charts/engagement`
**GET**
- Purpose: Fetches engagement chart data
- Query Parameters:
  - `timeRange`: string

### `/api/dashboard/charts/earnings`
**GET**
- Purpose: Fetches earnings chart data
- Query Parameters:
  - `timeRange`: string

### `/api/dashboard/earnings`
**GET**
- Purpose: Fetches earnings data
- Query Parameters:
  - `timeRange`: string

## Stories
### `/api/stories`
**GET**
- Purpose: Retrieve all stories with filtering
- Query Parameters:
  - `page`: number (default: 1)
  - `limit`: number (default: 10)
  - `genre`: string
  - `authorId`: string
  - `status`: string
  - `search`: string
  - `tags`: string
  - `language`: string
  - `sortBy`: string (default: "newest")

**POST**
- Purpose: Create a new story
- Authentication: Required
- Body: Story creation data

### `/api/stories/[id]`
**GET**
- Purpose: Retrieve specific story
- Parameters:
  - `id`: Story ID

### `/api/stories/by-slug/[slug]`
**GET**
- Purpose: Retrieve story by slug
- Parameters:
  - `slug`: Story slug

### `/api/stories/most-viewed`
**GET**
- Purpose: Retrieve most viewed stories
- Query Parameters:
  - `limit`: number (default: 8)

### `/api/stories/[id]/chapters`
**GET**
- Purpose: Retrieve all chapters for a story
- Parameters:
  - `id`: Story ID

### `/api/stories/[id]/chapters/[chapterId]`
**GET**
- Purpose: Retrieve specific chapter
- Parameters:
  - `id`: Story ID
  - `chapterId`: Chapter ID

### `/api/stories/[id]/comments`
**GET**
- Purpose: Retrieve story comments
- Parameters:
  - `id`: Story ID

## User Management
### `/api/user/[username]`
**GET**
- Purpose: Retrieve user profile
- Parameters:
  - `username`: User's username

## Image Handling
### `/api/upload-image`
**POST**
- Purpose: Upload an image
- Authentication: Required
- Body:
  ```typescript
  {
    key: string;
    contentType: string;
    data: number[];
  }
  ```

### `/api/images/[...key]`
**GET**
- Purpose: Serve images from S3
- Parameters:
  - `key`: Image path segments

## Metadata
### `/api/genres`
**GET**
- Purpose: Fetch all genres
- Response: List of genres sorted alphabetically

### `/api/languages`
**GET**
- Purpose: Fetch all languages
- Response: List of languages sorted alphabetically

## Notifications
### `/api/notifications`
**GET**
- Purpose: Retrieve user notifications
- Authentication: Required
- Query Parameters:
  - `page`: number
  - `limit`: number
  - `type`: string
  - `read`: boolean

### `/api/notifications/test`
**POST**
- Purpose: Create test notification
- Environment: Development only
- Authentication: Required

## Donations
### `/api/donations/create`
**POST**
- Purpose: Create new donation
- Authentication: Required
- Body: Donation details

## Scheduled Tasks
### `/api/scheduled-tasks`
**POST**
- Purpose: Trigger scheduled tasks
- Authentication: API Key required
- Body:
  ```typescript
  {
    tasks: string[] | ["all"]
  }
  ```

## Common Response Formats

### Success Response
```typescript
{
  success: true,
  data: any
}
```

### Error Response
```typescript
{
  error: string,
  message?: string,
  status: number
}
```

## Authentication Requirements

Most endpoints require one of:
1. Valid session token (for browser-based requests)
2. API key (for server-to-server communication)

## Rate Limiting
- Default: 100 requests per minute per IP
- Webhook endpoints: Custom limits apply

## Security Notes
1. All POST/PUT/DELETE endpoints require CSRF protection
2. API key must be sent via 'x-api-key' header
3. Session authentication via NextAuth.js