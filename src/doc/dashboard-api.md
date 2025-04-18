# Dashboard API Documentation

This document outlines the API implementation for the dashboard feature in the FableSpace application.

## Overview

The dashboard provides authors with insights into their stories' performance, including reads, likes, comments, followers, and earnings. The API is designed to fetch this data efficiently and present it in a user-friendly format.

## API Endpoints

### GET /api/dashboard/overview

Fetches overview data for the dashboard, including stats, top stories, and chart data.

**Query Parameters:**
- `timeRange`: The time range for the data (e.g., "7days", "30days", "90days", "year", "all")

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalReads": 45678,
      "totalLikes": 8943,
      "totalComments": 2156,
      "totalFollowers": 1243,
      "totalEarnings": 1289.65,
      "readsChange": 12.4,
      "likesChange": 8.7,
      "commentsChange": -3.2,
      "followersChange": 5.6,
      "earningsChange": 15.3
    },
    "stories": [
      {
        "id": "story-id",
        "title": "Story Title",
        "genre": "Fantasy",
        "reads": 12345,
        "likes": 678,
        "comments": 90,
        "date": "2023-06-15T10:30:00Z",
        "earnings": 123.45
      }
    ],
    "readsData": [
      { "name": "Jan", "reads": 4000 },
      { "name": "Feb", "reads": 3000 }
    ],
    "engagementData": [
      { "name": "Jan", "likes": 2400, "comments": 400 },
      { "name": "Feb", "likes": 1800, "comments": 300 }
    ]
  }
}
```

## Data Models

### DashboardStats
- `totalReads`: Total number of reads across all stories
- `totalLikes`: Total number of likes across all stories
- `totalComments`: Total number of comments across all stories
- `totalFollowers`: Total number of followers
- `totalEarnings`: Total earnings from all stories
- `readsChange`: Percentage change in reads compared to previous period
- `likesChange`: Percentage change in likes compared to previous period
- `commentsChange`: Percentage change in comments compared to previous period
- `followersChange`: Percentage change in followers compared to previous period
- `earningsChange`: Percentage change in earnings compared to previous period

### DashboardStory
- `id`: Story ID
- `title`: Story title
- `genre`: Story genre
- `reads`: Number of reads
- `likes`: Number of likes
- `comments`: Number of comments
- `date`: Last updated date (ISO string)
- `earnings`: Total earnings for the story

### ReadsDataPoint
- `name`: Month name
- `reads`: Number of reads for that month

### EngagementDataPoint
- `name`: Month name
- `likes`: Number of likes for that month
- `comments`: Number of comments for that month

## Implementation Details

The dashboard API uses Prisma to query the database for the required data. It calculates statistics based on the user's stories, views, likes, comments, followers, and donations.

For time-based comparisons, it compares the current period (e.g., last 30 days) with the previous period of the same length (e.g., 30-60 days ago) to calculate percentage changes.

## Error Handling

The API returns appropriate error responses with status codes:
- `401 Unauthorized`: If the user is not authenticated
- `400 Bad Request`: If the request is malformed or missing required parameters
- `500 Internal Server Error`: For server-side errors

## Development vs. Production

In development mode, the application uses mock data to simulate API responses, allowing for faster development and testing without requiring a fully set up database.

In production, the API connects to the actual database to fetch real data.

## Future Improvements

Planned improvements for the dashboard API include:
- Caching frequently accessed data to improve performance
- Adding more detailed analytics for individual stories
- Implementing real-time updates for key metrics
- Adding filtering options for more granular data analysis
