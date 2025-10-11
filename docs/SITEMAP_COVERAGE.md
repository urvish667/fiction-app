# FableSpace Sitemap Coverage

## Overview

The dynamic sitemap (`/sitemap.xml`) automatically includes all indexable pages on FableSpace with proper filtering for privacy and content status.

## Pages Included in Sitemap

### 1. Static Pages ✅
- **Home** (`/`) - Priority: 1.0, Daily updates
- **Browse** (`/browse`) - Priority: 0.9, Daily updates
- **About** (`/about`) - Priority: 0.7, Monthly updates
- **Contact** (`/contact`) - Priority: 0.6, Monthly updates
- **Privacy** (`/privacy`) - Priority: 0.5, Yearly updates
- **Terms** (`/terms`) - Priority: 0.5, Yearly updates
- **Blog** (`/blog`) - Priority: 0.7, Weekly updates
- **Challenges** (`/challenges`) - Priority: 0.6, Weekly updates

### 2. Browse Pages (Server-Side Rendered) ✅
**Genre Pages:**
- `/browse?genre=fantasy`
- `/browse?genre=science-fiction`
- `/browse?genre=romance`
- `/browse?genre=mystery`
- `/browse?genre=horror`
- And 20+ more genres...

**Genre + Language Combinations:**
- `/browse?genre=fantasy&language=Spanish`
- `/browse?genre=romance&language=French`
- Top 4 genres × Top 3 languages

**Priority:** 0.5-0.8, Daily/Weekly updates

### 3. Story Pages ✅
**Filter:** Only published stories (`status: 'ongoing'` or `'completed'`)

- `/story/{slug}` - All published stories
- **Priority:** 0.8, Weekly updates
- **Last Modified:** Story's `updatedAt` timestamp

### 4. Chapter Pages ✅
**Filter:** Only published chapters within published stories

- `/story/{slug}/chapter/{number}` - All published chapters
- **Priority:** 0.7, Monthly updates
- **Last Modified:** Chapter's `updatedAt` timestamp

### 5. Blog Posts ✅
**Filter:** Only published blog posts (`status: 'published'`)

- `/blog/{slug}` - All published blog posts
- **Priority:** 0.6, Weekly updates
- **Last Modified:** Blog's `updatedAt` timestamp

### 6. User Profiles ✅
**Filter:** Only users with public profiles enabled

**Requirements:**
- User must have a username
- `preferences.privacySettings.publicProfile === true`

**URLs:**
- `/user/{username}` - Public user profiles only
- **Priority:** 0.6, Weekly updates
- **Last Modified:** User's `updatedAt` timestamp

### 7. Author Forums ✅ **NEW**
**Filter:** Only forums enabled by their authors

**Requirements:**
- User must have a username
- User must have an AUTHOR type forum
- `preferences.privacySettings.forum === true`

**URLs:**
- `/user/{username}/forum` - Enabled author forums only
- **Priority:** 0.7, Daily updates
- **Last Modified:** User's `updatedAt` timestamp

**Why Daily Updates?**
Forums are dynamic community spaces with frequent new posts and discussions, so they're crawled more frequently than static profiles.

### 8. Tag Pages ✅
**Filter:** All tags in the database

- `/browse?tag={slug}` - All tag-based browse pages
- **Priority:** 0.7, Weekly updates
- Paginated to handle large tag lists (1000 per batch)

## Pages NOT Included (By Design)

### Private/Protected Pages
- `/write` - Author dashboard
- `/settings` - User settings
- `/dashboard` - Admin dashboard
- `/library` - Personal library
- `/notifications` - User notifications
- `/login`, `/signup` - Authentication pages
- `/reset-password`, `/verify-email` - Account management
- `/complete-profile` - Onboarding

### Draft Content
- Stories with `status: 'draft'`
- Unpublished blog posts
- Unpublished chapters

### Private Profiles
- User profiles with `publicProfile: false`
- Forums with `forum: false` in preferences

## Privacy & Security

### User Control
Users can control their visibility in the sitemap through preferences:

```json
{
  "privacySettings": {
    "publicProfile": true,  // Include /user/{username} in sitemap
    "forum": true           // Include /user/{username}/forum in sitemap
  }
}
```

### Default Behavior
- **Profiles:** Private by default (must opt-in to `publicProfile: true`)
- **Forums:** Disabled by default (must opt-in to `forum: true`)
- **Stories:** Only published stories are indexed
- **Blogs:** Only published blogs are indexed

## SEO Optimization

### Server-Side Rendering
All browse pages (`/browse?genre=...`) are now server-side rendered with initial story data, ensuring Google sees fully populated content.

### XML Entity Escaping
Query parameters with `&` are properly escaped to `&amp;` in the sitemap XML while maintaining valid URLs.

### Proper Priorities
- **1.0:** Homepage (highest)
- **0.9:** Main browse page
- **0.8:** Individual stories
- **0.7:** Chapters, forums, tags, about
- **0.6:** User profiles, blog posts, contact
- **0.5:** Legal pages (privacy, terms)

### Update Frequencies
- **Daily:** Homepage, browse pages, forums (dynamic content)
- **Weekly:** Stories, tags, profiles, blogs (regularly updated)
- **Monthly:** Chapters, about, contact (less frequent changes)
- **Yearly:** Privacy policy, terms of service (rarely change)

## Technical Implementation

### Database Queries
The sitemap uses efficient Prisma queries with:
- **Selective field selection** (only needed fields)
- **Proper filtering** (status, preferences)
- **Pagination** for large datasets (tags)
- **Parallel queries** where possible

### Performance
- Sitemap generation is cached by Next.js
- Regenerated on deployment or when cache expires
- Handles thousands of entries efficiently

### Error Handling
If database queries fail, the sitemap falls back to:
- Static pages
- Browse pages (from static configuration)

This ensures the sitemap is always available even during database issues.

## Monitoring & Maintenance

### Google Search Console
Monitor sitemap status at:
- `https://search.google.com/search-console`
- Submit sitemap URL: `https://fablespace.space/sitemap.xml`

### Regular Checks
1. **Coverage Report:** Check for indexing errors
2. **URL Inspection:** Test individual pages
3. **Sitemap Status:** Verify sitemap is being read correctly

### Expected Metrics
- **Total URLs:** 1,000+ (depending on content)
- **Indexed URLs:** Should match submitted URLs within 1-2 weeks
- **Soft 404s:** Should be zero after browse page SSR fix

## Future Enhancements

### Potential Additions
- **Forum Posts:** Individual forum post pages (if SEO-friendly URLs are added)
- **Genre Forums:** When genre-based forums are implemented
- **Fandom Forums:** When fandom-based forums are implemented
- **Challenge Pages:** Individual challenge detail pages
- **Collection Pages:** If story collections are made public

### Sitemap Index
If total URLs exceed 50,000, consider splitting into multiple sitemaps:
- `sitemap-stories.xml`
- `sitemap-chapters.xml`
- `sitemap-users.xml`
- `sitemap-forums.xml`
- `sitemap-blogs.xml`

Then create a sitemap index file that references all sub-sitemaps.

## Summary

The sitemap now comprehensively covers all public, indexable content on FableSpace:

✅ **8 content types** included
✅ **Privacy-aware** filtering
✅ **SEO-optimized** with proper priorities
✅ **Server-side rendered** browse pages
✅ **Forum pages** with author control
✅ **Production-ready** with error handling

All content respects user privacy settings and only includes published, public-facing pages.
