# Dashboard API Implementation

This document outlines the implementation details of the dashboard API in the FableSpace application.

## Overview

The dashboard provides authors with insights into their stories' performance, including reads, likes, comments, followers, and earnings. The API is designed to fetch real data from the database and present it in a user-friendly format.

## API Endpoints

### 1. Dashboard Overview

**Endpoint:** `/api/dashboard/overview`

Fetches all dashboard data in a single request, including stats, top stories, and chart data.

**Query Parameters:**
- `timeRange`: The time range for the data (e.g., "7days", "30days", "90days", "year", "all")

### 2. Dashboard Stats

**Endpoint:** `/api/dashboard/stats`

Fetches only the dashboard statistics.

**Query Parameters:**
- `timeRange`: The time range for the data

### 3. Top Stories

**Endpoint:** `/api/dashboard/stories`

Fetches the top performing stories.

**Query Parameters:**
- `limit`: Number of stories to return (default: 5)
- `sortBy`: Field to sort by (reads, likes, comments, earnings)

### 4. Chart Data

**Endpoints:**
- `/api/dashboard/charts/reads`: Fetches reads chart data
- `/api/dashboard/charts/engagement`: Fetches engagement chart data
- `/api/dashboard/charts/earnings`: Fetches earnings chart data

**Query Parameters:**
- `timeRange`: The time range for the chart data

## Service Functions

### 1. Dashboard Stats

The `getDashboardStats` function fetches and calculates:
- Total reads, likes, comments, followers, and earnings
- Percentage changes compared to the previous period
- Uses the specified time range for calculations

### 2. Top Stories

The `getTopStories` function:
- Fetches the user's stories
- Sorts them by the specified field
- Formats the data for display
- Handles special sorting for earnings (which is calculated from donations)

### 3. Chart Data

The chart data functions:
- `getReadsChartData`: Fetches reads data over time
- `getEngagementChartData`: Fetches likes and comments data over time
- `getEarningsChartData`: Fetches earnings data over time

## React Hooks

Custom React hooks are provided for each API endpoint:

1. `useDashboardStats`: Fetches dashboard statistics
2. `useDashboardStories`: Fetches top performing stories
3. `useReadsChartData`: Fetches reads chart data
4. `useEngagementChartData`: Fetches engagement chart data
5. `useEarningsChartData`: Fetches earnings chart data

## UI Components

The dashboard UI is divided into several components:

1. `OverviewTab`: Displays an overview of all dashboard data
2. `StoriesTab`: Displays a detailed list of the user's stories
3. `EarningsTab`: Displays earnings information
4. `AudienceTab`: Displays audience demographics

Each component uses the appropriate hooks to fetch the data it needs.

## Time Range Handling

The `calculateDateRanges` function handles time range calculations:
- Parses the time range parameter (7days, 30days, 90days, year, all)
- Calculates the start date for the current period
- Calculates the start and end dates for the previous period
- Used for percentage change calculations

## Error Handling

All API endpoints and hooks include proper error handling:
- API endpoints return appropriate status codes and error messages
- Hooks capture and display errors to the user
- UI components show loading states and error messages

## Database Queries

The implementation uses Prisma to query the database:
- Efficient queries with proper filtering and aggregation
- Includes related data where needed (e.g., donations for earnings calculations)
- Uses appropriate ordering for sorted results

## Future Improvements

Potential improvements for the dashboard API:
- Caching frequently accessed data
- Implementing real-time updates
- Adding more detailed analytics
- Optimizing database queries for larger datasets
