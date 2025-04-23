# FableSpace Recommendation System Documentation

## Overview

The FableSpace recommendation system is a content-based recommendation engine that suggests similar stories to users based on genre and tag similarity. The system computes similarity scores between stories using either cosine similarity or Jaccard similarity algorithms, and stores precomputed recommendations in the database for efficient retrieval.

## Architecture

The recommendation system consists of the following components:

1. **Database Model**: `StoryRecommendation` model in Prisma schema
2. **Similarity Utilities**: Functions for computing similarity between stories
3. **Recommendation Service**: Library for generating and storing recommendations
4. **API Endpoints**:
   - Endpoint to serve recommendations for a specific story
   - Endpoint to generate recommendations (protected by API key)
5. **Frontend Component**: React component to display recommendations on the chapter page

## Database Schema

The `StoryRecommendation` model stores precomputed recommendations:

```prisma
model StoryRecommendation {
  id                 String   @id @default(cuid())
  storyId            String
  recommendedStoryId String
  score              Float
  createdAt          DateTime @default(now())
  updatedAt          DateTime @updatedAt

  story              Story    @relation("StoryRecommendations", fields: [storyId], references: [id], onDelete: Cascade)
  recommendedStory   Story    @relation("RecommendedTo", fields: [recommendedStoryId], references: [id], onDelete: Cascade)

  @@unique([storyId, recommendedStoryId])
  @@index([storyId])
  @@index([recommendedStoryId])
  @@index([score])
}
```

## Similarity Algorithms

The system supports two similarity algorithms:

1. **Cosine Similarity**: Measures the cosine of the angle between two vectors
2. **Jaccard Similarity**: Measures the ratio of the intersection to the union of two sets

Stories are converted to binary vectors based on their genres and tags, and similarity is computed between these vectors.

## How to Generate Recommendations

Recommendations can be generated using either the API endpoint or the script. The API endpoint is the recommended method for production environments.

### Prerequisites

- Node.js 18 or higher
- Access to the FableSpace database
- API key for the recommendation generation endpoint (for API method)

### Method 1: Using the API Endpoint (Recommended)

The API endpoint allows you to generate recommendations for all stories or a specific story:

```bash
# Generate recommendations for all stories
curl -X POST https://your-domain.com/api/recommendations/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"config":{"excludeSameAuthor":true}}'

# Generate recommendations for a specific story
curl -X POST https://your-domain.com/api/recommendations/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"storyId":"story-uuid-here","config":{"excludeSameAuthor":true}}'
```

### Method 2: Using the Script

1. Navigate to the project root directory:
   ```bash
   cd path/to/fiction-app
   ```

2. Run the recommendation generator script:
   ```bash
   node scripts/generateRecommendations.js
   ```

### Setting Up Scheduled Generation

#### Option 1: Using Vercel Cron Jobs (Recommended for Production)

If your application is deployed on Vercel, you can use Vercel Cron Jobs to trigger the recommendation generation API endpoint at regular intervals:

1. Add the following to your `vercel.json` file:
   ```json
   {
     "crons": [
       {
         "path": "/api/recommendations/generate",
         "schedule": "0 2 * * *"
       }
     ]
   }
   ```

#### Option 2: Using Traditional Cron Jobs

**For Linux/macOS (using cron):**
```bash
# Edit crontab
crontab -e

# Add a line to call the API endpoint daily at 2 AM
0 2 * * * curl -X POST https://your-domain.com/api/recommendations/generate \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"config":{"excludeSameAuthor":true}}'
```

**For Windows (using Task Scheduler):**
- Create a PowerShell script that calls the API endpoint
- Set up a scheduled task to run the script daily

## Configuration Options

The recommendation system has several configuration options that can be adjusted when calling the API endpoint or in the recommendation service:

```javascript
// Default configuration
const DEFAULT_RECOMMENDATION_CONFIG = {
  maxRecommendationsPerStory: 10,  // Maximum number of recommendations per story
  similarityThreshold: 0.1,        // Minimum similarity score to consider
  excludeSameAuthor: true,         // Whether to exclude stories by the same author
  batchSize: 50                    // Number of stories to process in each batch
};
```

When calling the API endpoint, you can provide these options in the request body:

```json
{
  "storyId": "optional-story-id",
  "config": {
    "maxRecommendationsPerStory": 10,
    "similarityThreshold": 0.1,
    "excludeSameAuthor": true,
    "batchSize": 50
  }
}
```

## API Endpoints

### Fetching Recommendations

This endpoint serves recommendations for a specific story:

```
GET /api/recommendations/:storyId
```

#### Query Parameters

- `limit` (optional): Maximum number of recommendations to return (default: 5)
- `excludeSameAuthor` (optional): Whether to exclude stories by the same author (default: false)

### Generating Recommendations

This endpoint generates recommendations for all stories or a specific story:

```
POST /api/recommendations/generate
```

#### Request Body

```json
{
  "storyId": "optional-story-id",
  "config": {
    "maxRecommendationsPerStory": 10,
    "similarityThreshold": 0.1,
    "excludeSameAuthor": true,
    "batchSize": 50
  }
}
```

#### Authentication

This endpoint requires an API key for authentication:

```
Authorization: Bearer YOUR_API_KEY
```

The API key should be set in the environment variable `RECOMMENDATIONS_API_KEY`.

#### CSRF Protection

This endpoint is exempt from CSRF protection to allow it to be called by external services and cron jobs. It relies on the API key for security instead.

### Example Response

```json
[
  {
    "id": "cm9jgbv120005iz8syowqjxav",
    "title": "The Echo Glass",
    "slug": "the-echo-glass",
    "description": "A mysterious mirror that shows glimpses of the future...",
    "coverImage": "/api/images/stories%2Fcovers%2Fnew-1744778876698.jpg",
    "status": "ongoing",
    "author": {
      "id": "cm9h7ku3i0006iz20ycixntk0",
      "name": "Jane Smith",
      "username": "janesmith",
      "image": "/api/images/users%2Fcm9h7ku3i0006iz20ycixntk0%2Fprofile-1744778876698.jpg"
    },
    "genre": "Fantasy",
    "tags": ["magic", "adventure", "mystery"],
    "likeCount": 5,
    "commentCount": 2,
    "bookmarkCount": 3,
    "chapterCount": 3,
    "similarityScore": 0.75
  }
]
```

## Frontend Component

The `StoryRecommendations` component displays recommendations on the chapter page:

```jsx
<StoryRecommendations
  storyId={story.id}
  excludeSameAuthor={true}
  limit={6}
  className="mb-12"
/>
```

### Props

- `storyId` (required): ID of the story to get recommendations for
- `excludeSameAuthor` (optional): Whether to exclude stories by the same author (default: false)
- `limit` (optional): Maximum number of recommendations to display (default: 5)
- `className` (optional): Additional CSS classes to apply to the component

## Testing

The recommendation system includes unit tests for the similarity functions:

```bash
# Run tests for the similarity utilities
npm test -- src/__tests__/utils/similarity.test.ts
```

## Troubleshooting

### No Recommendations Generated

If no recommendations are generated for a story, check the following:

1. Make sure the story has genres and/or tags assigned
2. Check that there are other stories with similar genres and/or tags
3. Verify that the similarity threshold is not set too high

### API Endpoint Returns Empty Array

If the API endpoint returns an empty array, check the following:

1. Verify that the story ID is correct
2. Check that recommendations have been generated for the story
3. Make sure the story exists and is not a draft

## Future Enhancements

Potential enhancements for the recommendation system:

1. **Hybrid Recommendation System**: Combine content-based recommendations with collaborative filtering
2. **User Feedback**: Allow users to provide feedback on recommendations
3. **Personalized Recommendations**: Tailor recommendations based on user reading history
4. **Performance Optimization**: Add caching for recommendation API responses
5. **A/B Testing**: Test different similarity algorithms and thresholds
6. **Parallel Processing**: Implement true parallel processing for large datasets
7. **Real-time Recommendations**: Generate recommendations in real-time when stories are published
8. **Recommendation Analytics**: Track which recommendations lead to reads and engagement
