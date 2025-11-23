# Image Caching & CDN Optimization Guide

## Overview

Your images are now optimized for CDN caching with comprehensive headers. Here's how to maximize performance with Cloudflare and other CDN providers.

## ✅ What's Already Configured

### Backend Image Controller
**File:** `fiction-app-backend/src/controllers/image.controller.ts`

```typescript
// Enhanced caching headers
Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable
Vary: Accept-Encoding
X-Content-Type-Options: nosniff
ETag: "<image-key>"
```

**What this means:**
- `public`: CDN can cache the image
- `max-age=31536000`: Browser caches for 1 year
- `s-maxage=31536000`: CDN caches for 1 year
- `immutable`: Image never changes (perfect for versioned/hashed filenames)
- `Vary: Accept-Encoding`: Enables compression-aware caching
- `ETag`: Enables conditional requests (304 Not Modified)

### Next.js Frontend
**File:** `fiction-app/next.config.js`

```javascript
// Security headers for all pages
X-DNS-Prefetch-Control: on
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: origin-when-cross-origin

// Static asset caching (1 year)
/_next/static/*: Cache-Control: public, max-age=31536000, immutable
/static/*: Cache-Control: public, max-age=31536000, immutable
```

## Cloudflare Configuration

### Option 1: Using Backend as Image Proxy (Current Setup)

**Pros:**
- Simple setup, already working
- Backend handles authentication/access control
- Easy to add image processing/resizing

**Cons:**
- Backend becomes a bottleneck for images
- Uses backend bandwidth
- Slower than direct CDN access

**Cloudflare Settings:**
1. **Cache Everything** - Enable in Page Rules
2. **Browser Cache TTL** - Set to "Respect Existing Headers"
3. **Edge Cache TTL** - Set to "1 year"

**Page Rule Example:**
```
URL: yourdomain.com/api/v1/images/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: Respect Existing Headers
```

### Option 2: Direct Azure Blob Storage + Cloudflare (Recommended)

**Pros:**
- Much faster (direct CDN → Azure)
- No backend bandwidth usage
- Cloudflare caches at edge locations worldwide
- Automatic image optimization with Cloudflare Polish

**Setup Steps:**

#### 1. Configure Azure Blob Storage for Public Access

```bash
# Set container to allow public blob access
az storage container set-permission \
  --name fiction-app-dev \
  --public-access blob \
  --connection-string "<your-connection-string>"
```

Or in Azure Portal:
1. Go to Storage Account → Containers
2. Select your container (`fiction-app-dev`)
3. Change "Public access level" to "Blob (anonymous read access for blobs only)"

#### 2. Update Image URLs in Your App

**Current:** `https://yourdomain.com/api/v1/images/stories/cover-123.jpg`
**New:** `https://yourcdn.yourdomain.com/stories/cover-123.jpg`

**Implementation:**

Create a helper function:
```typescript
// fiction-app/src/lib/utils/image-url.ts
export function getImageUrl(azureBlobKey: string): string {
  // Use CDN URL for production, backend proxy for development
  if (process.env.NODE_ENV === 'production') {
    return `https://cdn.fablespace.space/${azureBlobKey}`;
  }
  return `/api/v1/images/${azureBlobKey}`;
}
```

#### 3. Configure Cloudflare

**DNS Setup:**
```
cdn.fablespace.space → CNAME → <your-azure-storage-account>.blob.core.windows.net
```

**Cloudflare Page Rules:**
```
URL: cdn.fablespace.space/*
Settings:
  - Cache Level: Cache Everything
  - Edge Cache TTL: 1 year
  - Browser Cache TTL: 1 year
  - Polish: Lossless (or Lossy for smaller files)
  - Mirage: On (lazy loading)
  - Auto Minify: Off (not needed for images)
```

**Transform Rules (Optional - Image Resizing):**
```
URL: cdn.fablespace.space/*
Transform:
  - Enable Cloudflare Image Resizing
  - Quality: 85
  - Format: Auto (WebP when supported)
```

#### 4. Update Azure Blob Storage Headers

Add these headers when uploading images:

```typescript
// fiction-app-backend/src/lib/azure-service.ts
static async uploadImage(key: string, data: ArrayBuffer, contentType = 'image/jpeg'): Promise<string> {
  const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
  const blockBlobClient = containerClient.getBlockBlobClient(key);

  await blockBlobClient.uploadData(Buffer.from(data), {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: 'public, max-age=31536000, immutable', // 1 year cache
    },
  });

  return blockBlobClient.url;
}
```

## Image Optimization Best Practices

### 1. Use Versioned/Hashed Filenames

**Bad:** `story-cover.jpg` (can't use immutable caching)
**Good:** `story-cover-abc123.jpg` or `stories/123/cover-v2.jpg`

When the image changes, use a new filename. This allows aggressive caching.

### 2. Optimize Images Before Upload

```typescript
// Example using sharp library
import sharp from 'sharp';

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(1200, 630, { fit: 'cover' }) // Resize to standard OG image size
    .jpeg({ quality: 85, progressive: true })
    .toBuffer();
}
```

### 3. Generate Multiple Sizes

```typescript
// Generate thumbnail, medium, and full sizes
const sizes = {
  thumb: { width: 300, height: 200 },
  medium: { width: 800, height: 533 },
  full: { width: 1200, height: 800 }
};

for (const [size, dimensions] of Object.entries(sizes)) {
  const resized = await sharp(buffer)
    .resize(dimensions.width, dimensions.height, { fit: 'cover' })
    .jpeg({ quality: 85 })
    .toBuffer();
    
  await AzureService.uploadImage(`stories/${storyId}/cover-${size}.jpg`, resized);
}
```

### 4. Use WebP Format

```typescript
// Upload both JPEG and WebP versions
await AzureService.uploadImage(`stories/${storyId}/cover.jpg`, jpegBuffer, 'image/jpeg');
await AzureService.uploadImage(`stories/${storyId}/cover.webp`, webpBuffer, 'image/webp');

// In frontend, use <picture> element
<picture>
  <source srcSet="/api/v1/images/stories/123/cover.webp" type="image/webp" />
  <img src="/api/v1/images/stories/123/cover.jpg" alt="Story cover" />
</picture>
```

## Cloudflare-Specific Features

### 1. Polish (Automatic Image Optimization)

Cloudflare automatically optimizes images:
- Converts to WebP when browser supports it
- Strips metadata
- Compresses without quality loss

**Enable:** Cloudflare Dashboard → Speed → Optimization → Polish

### 2. Mirage (Lazy Loading)

Automatically lazy loads images:
- Loads low-res placeholder first
- Loads full image when in viewport

**Enable:** Cloudflare Dashboard → Speed → Optimization → Mirage

### 3. Image Resizing (Paid Feature)

Resize images on-the-fly:
```html
<!-- Original: 2000x1500 -->
<img src="https://cdn.fablespace.space/cdn-cgi/image/width=800,quality=85/stories/cover.jpg" />
```

### 4. Cache Analytics

Monitor cache hit rates:
- Cloudflare Dashboard → Analytics → Caching
- Look for "Cache Hit Ratio" (aim for >90%)

## Performance Monitoring

### Check Cache Headers

```bash
# Test image caching
curl -I https://yourdomain.com/api/v1/images/stories/cover.jpg

# Look for:
# Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable
# CF-Cache-Status: HIT (means Cloudflare cached it)
# Age: <seconds since cached>
```

### Cloudflare Cache Status Headers

- `HIT`: Served from Cloudflare cache ✅
- `MISS`: Not in cache, fetched from origin
- `EXPIRED`: Cache expired, revalidating
- `STALE`: Serving stale while revalidating
- `BYPASS`: Cache bypassed (not cacheable)
- `REVALIDATED`: Cache revalidated successfully

## Migration Path (Current → Optimized)

### Phase 1: Current Setup (✅ Done)
- Backend serves images with proper cache headers
- Cloudflare caches backend responses

### Phase 2: Hybrid Approach (Recommended Next Step)
- Keep backend for authenticated/private images
- Use direct Azure URLs for public images (covers, avatars)
- Cloudflare caches both

### Phase 3: Full CDN (Optional)
- All images served directly from Azure via Cloudflare
- Backend only handles uploads
- Maximum performance

## Cost Comparison

### Current Setup (Backend Proxy)
- Backend bandwidth: ~$0.10/GB
- Cloudflare bandwidth: Free (unlimited)
- **Total:** $0.10/GB

### Direct Azure + Cloudflare
- Azure bandwidth: ~$0.05/GB (first 10TB)
- Cloudflare bandwidth: Free (unlimited)
- **Total:** $0.05/GB (50% savings)

### With Cloudflare Caching (90% hit rate)
- Azure bandwidth: ~$0.005/GB (only 10% of requests)
- Cloudflare bandwidth: Free
- **Total:** $0.005/GB (95% savings!)

## Recommended Next Steps

1. **Immediate (No code changes):**
   - Configure Cloudflare Page Rules for `/api/v1/images/*`
   - Enable Polish and Mirage
   - Monitor cache hit rates

2. **Short-term (1-2 hours):**
   - Make Azure Blob Storage public
   - Set up CDN subdomain in Cloudflare
   - Update image URLs for new uploads

3. **Long-term (Optional):**
   - Implement image resizing/optimization on upload
   - Generate WebP versions
   - Use responsive images with srcset

## Summary

✅ **Already Optimized:**
- Backend serves images with 1-year cache headers
- Immutable caching for CDN
- ETag support for conditional requests
- Security headers configured

🚀 **Next Level (Recommended):**
- Direct Azure Blob Storage access via Cloudflare CDN
- 95% cost savings on bandwidth
- Faster image delivery worldwide
- Automatic image optimization with Polish

Your images are already well-optimized for CDN caching. The current setup will work great with Cloudflare!
