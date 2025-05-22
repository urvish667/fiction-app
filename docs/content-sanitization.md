# Content Sanitization in FableSpace

This document outlines the content sanitization approach implemented in FableSpace to prevent XSS attacks and ensure user-generated content is safe.

## Overview

FableSpace implements content sanitization for all user-generated content, including:

1. Story content (chapters)
2. Story metadata (title, description)
3. Comments
4. User profiles

## Sanitization Utilities

The application uses the following sanitization utilities from `src/lib/security/input-validation.ts`:

- `sanitizeHtml(html)`: Uses DOMPurify to sanitize HTML content while preserving formatting
- `sanitizeText(text)`: Removes HTML tags but preserves readable characters (quotes, apostrophes, etc.)
- `sanitizeTextForHtml(text)`: Removes HTML tags and encodes special characters for safe HTML display
- `sanitizeUrl(url)`: Validates URLs to prevent javascript: and data: URLs

## Implementation Details

### Chapter Content

Chapter content is sanitized using `sanitizeHtml()` before being stored in Azure Blob Storage:

- `src/app/api/stories/[id]/chapters/route.ts` (POST endpoint)
- `src/app/api/stories/[id]/chapters/[chapterId]/route.ts` (PUT endpoint)

This preserves the rich text formatting while removing potentially malicious scripts.

### Story Metadata

Story titles and descriptions are sanitized using `sanitizeText()` before being stored in the database:

- `src/app/api/stories/route.ts` (POST endpoint)
- `src/app/api/stories/[id]/route.ts` (PUT endpoint)

The `sanitizeText()` function removes HTML tags but preserves normal characters like quotes and apostrophes, ensuring that user input remains readable while preventing XSS attacks.

### Comments

Comment content is sanitized using `sanitizeText()` before being stored in the database:

- `src/app/api/stories/[id]/chapters/[chapterId]/comments/route.ts` (POST endpoint)

### Authentication

User input in authentication flows is sanitized using `sanitizeText()`:

- `src/app/api/auth/signup/route.ts`: Sanitizes email, username, and pronoun during signup
- `src/app/api/auth/[...nextauth]/route.ts`:
  - Sanitizes email in credentials provider
  - Sanitizes name and email from OAuth providers (Google, Facebook)
  - Sanitizes user data before storing in database during OAuth sign-in

## Sanitization Strategy

The application uses different sanitization strategies based on the content type:

1. **Rich Text Content** (chapter content): Uses `sanitizeHtml()` to preserve formatting while removing malicious code
2. **Plain Text Content** (titles, descriptions, comments): Uses `sanitizeText()` to remove HTML tags while preserving readable characters
3. **HTML Display Content**: Uses `sanitizeTextForHtml()` to encode special characters for safe HTML display
4. **URLs** (links, images): Uses `sanitizeUrl()` to validate and sanitize URLs

## Advanced Validation Framework

The application also includes a comprehensive validation framework in `src/lib/validation/api-validation.ts` that can automatically sanitize validated data based on field names:

- Fields containing 'html' or 'content' use `sanitizeHtml()`
- Fields containing 'url', 'link', or 'website' use `sanitizeUrl()`
- Other string fields use `sanitizeText()`

This framework can be used with the `withRequestValidation` middleware for API routes.

## Best Practices

When implementing new features that handle user input:

1. Always sanitize user input before storing it
2. Use the appropriate sanitization function based on the content type
3. Consider using the validation framework with `withRequestValidation` middleware
4. For rich text content, use `sanitizeHtml()`
5. For plain text content, use `sanitizeText()`
6. For URLs, use `sanitizeUrl()`

## Security Considerations

- Content is sanitized at the API level before storage
- The sanitization is applied consistently across all user input
- The application uses DOMPurify with a restricted set of allowed tags and attributes
- All sanitization happens on the server side, not relying on client-side sanitization
