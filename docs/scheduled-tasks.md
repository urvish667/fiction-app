# Scheduled Tasks

This document describes the scheduled tasks functionality in the Fiction App.

## Chapter Scheduling

The Fiction App supports scheduling chapters for automatic publishing at a specified date and time. This allows authors to prepare content in advance and have it automatically published according to a schedule.

### How Chapter Scheduling Works

1. When creating or editing a chapter, authors can set:
   - Status: "draft", "scheduled", or "published"
   - Publish Date: The date and time when a scheduled chapter should be published

2. Chapters with status "scheduled" and a publish date in the past will be automatically published by the scheduled tasks system.

3. When a chapter is published (either manually or automatically), the story's status is updated accordingly:
   - If all chapters are in "draft" or "scheduled" status, the story is marked as "draft"
   - If at least one chapter is "published", the story is marked as "ongoing"
   - If at least one chapter is "published" and the story is manually marked as completed, the story is marked as "completed"

### Implementation Details

The scheduled tasks system consists of:

1. **Scheduled Tasks Handler** (`src/lib/scheduled-tasks.ts`):
   - Contains the logic for processing scheduled chapters
   - Finds chapters with status "scheduled" and publish date in the past
   - Updates their status to "published"
   - Updates the story status if needed

2. **API Route** (`src/app/api/scheduled-tasks/route.ts`):
   - Provides an HTTP endpoint for triggering scheduled tasks
   - Secured with an API key
   - Can be called by an external cron job service

3. **Prisma Middleware** (`src/lib/prisma.ts`):
   - Automatically updates story status when chapters are created, updated, or deleted
   - Ensures story status is always consistent with its chapters

4. **Manual Script** (`scripts/process-scheduled-chapters.js`):
   - Can be run manually to process scheduled chapters
   - Useful for testing or in case the automated system fails

### Setting Up Scheduled Tasks

#### Option 1: Using Vercel Cron Jobs (Recommended for Production)

If your application is deployed on Vercel, you can use Vercel Cron Jobs to trigger the scheduled tasks API endpoint at regular intervals:

1. Add the following to your `vercel.json` file:
   ```json
   {
     "crons": [
       {
         "path": "/api/scheduled-tasks",
         "schedule": "*/5 * * * *"
       }
     ]
   }
   ```

2. Set the `SCHEDULED_TASKS_API_KEY` environment variable in your Vercel project settings.

3. Deploy your application to Vercel.

#### Option 2: Using an External Cron Job Service

You can use an external cron job service (like Uptime Robot, Cronitor, or cron-job.org) to call your API endpoint at regular intervals:

1. Set up a cron job to make a POST request to `https://your-domain.com/api/scheduled-tasks` every 5 minutes.

2. Include the API key in the request headers:
   ```
   Authorization: Bearer your-api-key
   ```

3. Set the `SCHEDULED_TASKS_API_KEY` environment variable in your hosting environment.

#### Option 3: Manual Execution

You can run the scheduled tasks manually using the provided script:

```bash
npm run scheduled-tasks
```

### Testing Scheduled Publishing

To test the scheduled publishing functionality:

1. Create a new chapter with status "scheduled" and a publish date a few minutes in the future.

2. Wait for the scheduled time to pass.

3. Run the scheduled tasks manually or wait for the automated system to run.

4. Verify that the chapter status has changed to "published" and the story status has been updated accordingly.

## Troubleshooting

If scheduled chapters are not being published automatically:

1. Check that the `SCHEDULED_TASKS_API_KEY` environment variable is set correctly.

2. Verify that the cron job is running and making successful requests to the API endpoint.

3. Check the server logs for any errors related to scheduled tasks.

4. Try running the scheduled tasks manually using the provided script.

5. Verify that the chapter has status "scheduled" and a publish date in the past.

## Future Improvements

Potential improvements to the scheduled tasks system:

1. Add a dashboard for monitoring scheduled tasks and their execution status.

2. Implement retry logic for failed tasks.

3. Add notifications for authors when their scheduled chapters are published.

4. Support more granular scheduling options (e.g., recurring schedules).

5. Add analytics for tracking the performance of scheduled publishing.
