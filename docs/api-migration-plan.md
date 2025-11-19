# Fiction App API Migration Plan: Writing Flow

This document compares the old story and chapter APIs used in the `/write` folder of fiction-app with the new APIs from fiction-app-backend, and provides a comprehensive migration plan.

## Executive Summary

The writing flow APIs are being migrated from Next.js API routes to a new Express-based REST API system. This migration provides better scalability, consistent response formats, enhanced validation, and improved tag management.

**Key Changes:**
- Authentication: NextAuth sessions → JWT tokens
- Response Format: Direct objects → Structured `{success, data, message}` format
- Enhanced validation and error handling
- New tag management endpoints
- Improved filtering and sorting options

---

## Writing Flow API Analysis

### Current Writing Flow Structure

The writing flow in fiction-app consists of:
1. **Story Creation & Management** (via `/write/story-info`)
2. **Chapter Editor** (via `/write/editor/[storyId]/[chapterId]`)
3. **API Services** (`src/lib/api/story.ts`, `src/lib/api/chapter.ts`)

### APIs Currently Used in Writing Flow

#### Story Operations (Currently Used)

| Operation | Current Endpoint | Method | Authentication |
|-----------|-----------------|--------|----------------|
| Create Story | `/api/stories` | POST | NextAuth Session |
| Update Story | `/api/stories/[id]` | PUT | NextAuth Session |
| Get Story | `/api/stories/[id]` | GET | Optional |
| Get Story by Slug | `/api/stories/by-slug/[slug]` | GET | Optional |
| Like/Unlike Story | `/api/stories/[id]/like` | POST/DELETE | NextAuth Session |
| Bookmark/Unbookmark | `/api/stories/[id]/bookmark` | POST/DELETE | NextAuth Session |

#### Chapter Operations (Currently Used)

| Operation | Current Endpoint | Method | Authentication |
|-----------|-----------------|--------|----------------|
| Get Chapters | `/api/stories/[storyId]/chapters` | GET | Optional |
| Get Chapter | `/api/stories/[storyId]/chapters/[chapterId]` | GET | Optional |
| Create Chapter | `/api/stories/[storyId]/chapters` | POST | NextAuth Session |
| Update Chapter | `/api/stories/[storyId]/chapters/[chapterId]` | PUT | NextAuth Session |
| Delete Chapter | `/api/stories/[storyId]/chapters/[chapterId]` | DELETE | NextAuth Session |
| Like/Unlike Chapter | `/api/stories/[storyId]/chapters/[chapterId]/like` | POST/DELETE | NextAuth Session |
| Reading Progress | `/api/reading-progress` | PUT | NextAuth Session |

---

## New API Structure

### Story Operations (New)

| Operation | New Endpoint | Method | Authentication |
|-----------|-------------|--------|----------------|
| Create Story | `/api/v1/stories` | POST | JWT Token |
| Update Story | `/api/v1/stories/:id` | PUT | JWT Token |
| Get Story | `/api/v1/stories/:id` | GET | Optional |
| Get Story by Slug | `/api/v1/stories/slug/:slug` | GET | Optional |
| Like/Unlike Story | `/api/v1/stories/:id/like` | POST/DELETE | JWT Token |
| Bookmark/Unbookmark | `/api/v1/stories/:id/bookmark` | POST/DELETE | JWT Token |
| Get Most Viewed | `/api/v1/stories/most-viewed` | GET | Optional |
| **NEW**: Manage Tags | `/api/v1/stories/:id/tags` | GET/POST/DELETE | JWT Token |
| Get All Stories | `/api/v1/stories` | GET | Optional |

### Chapter Operations (New)

| Operation | New Endpoint | Method | Authentication |
|-----------|-------------|--------|----------------|
| Get Chapters | `/api/v1/stories/:storyId/chapters` | GET | Optional |
| Get Chapter | `/api/v1/chapters/:id` | GET | Optional |
| Create Chapter | `/api/v1/stories/:storyId/chapters` | POST | JWT Token |
| Update Chapter | `/api/v1/chapters/:id` | PUT | JWT Token |
| Delete Chapter | `/api/v1/chapters/:id` | DELETE | JWT Token |
| Like/Unlike Chapter | `/api/v1/chapters/:id/like` | POST/DELETE | JWT Token |
| **NEW**: Check Like Status | `/api/v1/chapters/:id/like/check` | GET | Optional |
| Reading Progress | `/api/v1/reading-progress` | PUT | JWT Token |

---

## Key Differences and Migration Impact

### 1. Response Format Changes

**Old Response:**
```json
{
  "id": "story_id",
  "title": "Story Title",
  "tags": [{"id": "tag_id", "name": "Adventure"}]
}
```

**New Response:**
```json
{
  "success": true,
  "data": {
    "id": "story_id",
    "title": "Story Title",
    "tags": [
      {
        "id": "tag_id",
        "name": "Adventure",
        "slug": "adventure"
      }
    ]
  },
  "message": "Story created successfully"
}
```

**Migration Required:**
- Update all API response handling to check `success` field
- Extract data from `data` property
- Handle `message` for user feedback

### 2. Authentication Changes

**Old:** NextAuth session-based
```typescript
// Current implementation
const { data: session } = useSession();
const accessToken = session?.accessToken;
```

**New:** JWT token-based
```typescript
// New implementation needed
const token = await getAccessToken(); // HTTP-only cookie
const accessToken = token?.access_token;
```

**Migration Required:**
- Update API client to handle JWT tokens
- Remove NextAuth dependency for API calls
- Implement token refresh logic

### 3. Chapter Endpoint Structure Changes

**Old:** Nested chapter endpoints
```
/api/stories/[storyId]/chapters/[chapterId]
```

**New:** Flat chapter endpoints with ID
```
/api/v1/chapters/:id
```

**Migration Required:**
- Update chapter URLs from nested to flat structure
- Store chapter ID instead of relying on nested path

### 4. Tag Management Enhancement

**Old:** Tags managed through story updates
```typescript
// Current: Tags included in story update
await updateStory({
  title: "New Title",
  tags: ["Adventure", "Fantasy"]
});
```

**New:** Dedicated tag endpoints
```typescript
// New: Separate tag management
await addTagsToStory(storyId, ["Adventure", "Fantasy"]);
await removeTagsFromStory(storyId, ["Old Tag"]);
```

**Migration Required:**
- Implement new tag management methods
- Update UI to use separate tag operations
- Handle automatic tag creation

---

## Missing API Analysis

### New APIs Not Present in Old System

| New API | Purpose | Impact |
|---------|---------|--------|
| `/api/v1/stories/most-viewed` | Get most viewed stories | **LOW** - Not used in writing flow |
| `/api/v1/stories/:id/tags` | Dedicated tag management | **HIGH** - Enables better tag UX |
| `/api/v1/chapters/:id/like/check` | Check like status | **LOW** - Nice to have |

### Old APIs Not Present in New System

| Old API | New Equivalent | Migration Status |
|---------|----------------|------------------|
| `/api/stories/by-slug/[slug]` | `/api/v1/stories/slug/:slug` | ✅ **MAPPED** |
| `/api/stories/[id]/like` | `/api/v1/stories/:id/like` | ✅ **MAPPED** |
| `/api/stories/[id]/bookmark` | `/api/v1/stories/:id/bookmark` | ✅ **MAPPED** |
| `/api/stories/[storyId]/chapters/[chapterId]` | `/api/v1/chapters/:id` | ✅ **MAPPED** |

**Status:** All existing APIs have been mapped to new equivalents.

---

## Migration Plan

### Phase 1: API Client Updates

1. **Update API Client Configuration**
   ```typescript
   // Update src/lib/apiClient.ts
   - Remove NextAuth dependency
   - Implement JWT token handling
   - Add automatic token refresh
   ```

2. **Update Response Handling**
   ```typescript
   // Update all API services
   - Handle `{success, data, message}` structure
   - Extract data from `data` property
   - Use `message` for user notifications
   ```

3. **Update Error Handling**
   ```typescript
   // Standardized error responses
   - Handle structured error format
   - Extract validation errors
   - Implement retry logic for token refresh
   ```

### Phase 2: Story API Migration

1. **Create New Story API Service**
   ```typescript
   // Update src/lib/api/story.ts
   - Replace all endpoints with new `/api/v1/` URLs
   - Update response handling
   - Add new tag management methods
   ```

2. **Add Tag Management**
   ```typescript
   // New tag management methods
   - getStoryTags(storyId: string)
   - addTagsToStory(storyId: string, tags: string[])
   - removeTagsFromStory(storyId: string, tags: string[])
   ```

3. **Update Story Creation/Editing Components**
   ```typescript
   // Update components using story APIs
   - Update endpoint URLs
   - Handle new response format
   - Implement tag management UI
   ```

### Phase 3: Chapter API Migration

1. **Update Chapter API Service**
   ```typescript
   // Update src/lib/api/chapter.ts
   - Replace nested endpoints with flat structure
   - Update all chapter operations
   - Add like status checking
   ```

2. **Update Chapter Editor Hooks**
   ```typescript
   // Update src/hooks/use-chapter-editor.ts
   - Update API calls to use new endpoints
   - Handle new response format
   - Add like status checking
   ```

3. **Update Chapter Components**
   ```typescript
   // Update chapter-related components
   - Update API calls
   - Handle chapter ID instead of nested paths
   - Update error handling
   ```

### Phase 4: Authentication Integration

1. **Implement JWT Token Management**
   ```typescript
   // Add token management
   - Extract tokens from HTTP-only cookies
   - Implement automatic refresh
   - Handle token expiration
   ```

2. **Update Middleware**
   ```typescript
   // Update src/middleware.ts
   - Replace NextAuth checks with JWT validation
   - Update rate limiting configuration
   - Handle authentication redirects
   ```

### Phase 5: Testing and Validation

1. **Update Unit Tests**
   - Test new API response handling
   - Validate JWT token flow
   - Test error handling scenarios

2. **Integration Testing**
   - End-to-end story creation flow
   - Chapter editing and publishing
   - Tag management operations

3. **User Acceptance Testing**
   - Verify writing flow works seamlessly
   - Test error scenarios
   - Validate performance improvements

---

## Implementation Recommendations

### Immediate Actions (Week 1)

1. **Update API Client Base Configuration**
   - Modify `src/lib/apiClient.ts` to use new base URL and JWT handling
   - Implement response wrapper for new format

2. **Create Migration Helper Functions**
   ```typescript
   // utils/api-migration.ts
   - handleNewResponse<T>(response: any): T
   - extractApiError(error: any): string
   - normalizeStoryResponse(data: any): Story
   - normalizeChapterResponse(data: any): Chapter
   ```

3. **Start with Story APIs**
   - Begin with `/write/story-info` page
   - Test story creation and updating

### Short Term (Week 2-3)

1. **Complete Chapter API Migration**
   - Update chapter editor components
   - Test all chapter operations
   - Validate like functionality

2. **Implement Tag Management**
   - Add tag management UI
   - Create tag suggestion system
   - Test tag operations

### Medium Term (Week 4-6)

1. **Authentication Integration**
   - Implement JWT token management
   - Update all authentication checks
   - Test token refresh flow

2. **Performance Optimization**
   - Implement response caching
   - Add optimistic updates
   - Test loading states

### Long Term (Week 7-8)

1. **Feature Enhancements**
   - Add new tag management features
   - Implement enhanced error reporting
   - Add performance monitoring

2. **Documentation Updates**
   - Update API documentation
   - Create migration guide for developers
   - Document new features

---

## Risk Assessment

### High Risk Items

1. **Authentication Flow Changes**
   - **Risk:** Breaking user sessions during migration
   - **Mitigation:** Implement gradual rollout with fallback authentication
   - **Testing:** Extensive authentication testing required

2. **Response Format Changes**
   - **Risk:** Breaking existing API response handling
   - **Mitigation:** Use wrapper functions to normalize responses
   - **Testing:** Unit tests for all API responses

### Medium Risk Items

1. **Chapter Endpoint Structure**
   - **Risk:** URL structure changes breaking existing references
   - **Mitigation:** Update all chapter references systematically
   - **Testing:** Integration tests for chapter operations

2. **Tag Management Implementation**
   - **Risk:** Complex tag UI implementation
   - **Mitigation:** Start with simple tag management, enhance incrementally
   - **Testing:** User acceptance testing for tag features

### Low Risk Items

1. **New Endpoint Additions**
   - **Risk:** Unused new endpoints
   - **Mitigation:** Implement only needed features initially
   - **Testing:** Feature toggles for new functionality

---

## Success Metrics

### Technical Metrics
- **API Response Time:** Target < 200ms for story operations
- **Error Rate:** Target < 1% for all API calls
- **Authentication Success Rate:** Target > 99%
- **Test Coverage:** Target > 95% for migrated code

### User Experience Metrics
- **Story Creation Success Rate:** Target > 98%
- **Chapter Editing Success Rate:** Target > 98%
- **User Session Stability:** Target < 1% session loss
- **Tag Management Adoption:** Track usage of new tag features

---

## Rollback Plan

### Rollback Triggers
- Authentication failures > 5%
- Story creation errors > 10%
- Performance degradation > 20%
- User-reported critical issues

### Rollback Steps
1. **Immediate Rollback**
   - Revert API client to use old endpoints
   - Switch back to NextAuth authentication
   - Disable new features via feature flags

2. **Data Recovery**
   - Ensure no data loss during rollback
   - Verify all user data integrity
   - Test story/chapter data consistency

3. **Communication**
   - Notify users of any service interruption
   - Provide status updates during rollback
   - Document lessons learned

---

## Conclusion

The migration from old APIs to new APIs represents a significant improvement in the writing flow architecture. The new system provides:

- **Better Scalability:** Express-based architecture handles more concurrent users
- **Consistent API Design:** Standardized response format and error handling
- **Enhanced Features:** Improved tag management and like functionality
- **Better Security:** JWT-based authentication with HTTP-only cookies

**Key Success Factors:**
1. Gradual migration with thorough testing
2. Comprehensive error handling and rollback plans
3. User-centered approach to new features
4. Performance monitoring and optimization

The migration plan provides a clear path from the current Next.js API routes to the new Express-based REST API, ensuring a smooth transition for both developers and users.
