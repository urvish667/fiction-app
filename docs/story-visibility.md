# Story Visibility in FableSpace

This document explains how story visibility works in FableSpace.

## Overview

In FableSpace, all stories are public by default once they have at least one published chapter. There is no option to make stories private.

## Story Status

A story can have one of three statuses:

1. **Draft** - A story with no published chapters. Only visible to the author.
2. **Ongoing** - A story with at least one published chapter. Visible to all users.
3. **Completed** - A story that has been marked as completed by the author. Visible to all users.

## Visibility Rules

- **Draft stories** are only visible to their authors
- **Ongoing and Completed stories** are visible to all users
- A story automatically transitions from "draft" to "ongoing" when the first chapter is published
- A story can be manually marked as "completed" by the author

## Chapter Status

Chapters can have one of three statuses:

1. **Draft** - Only visible to the author
2. **Scheduled** - Set to be published at a future date and time
3. **Published** - Visible to all users

## Publishing Process

1. When an author creates a new story, it starts with a "draft" status
2. When the author publishes their first chapter, the story status changes to "ongoing"
3. The story becomes visible to all users at this point
4. The author can mark the story as "completed" when they finish writing it

## Important Notes

- There is no way to make a story with published chapters private
- Authors should be aware that once they publish a chapter, the story will be visible to everyone
- The visibility of individual chapters can still be controlled (draft vs. published)
- Scheduled chapters will automatically become published at the specified date and time

## Technical Implementation

The visibility of a story is determined by the `isStoryPublic` function in `src/lib/story-helpers.ts`:

```typescript
export function isStoryPublic(storyStatus: "draft" | "ongoing" | "completed"): boolean {
  return storyStatus === "ongoing" || storyStatus === "completed";
}
```

This function is used throughout the application to determine whether a story should be visible to non-authors.
