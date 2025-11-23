# Cloudflare CDN Setup Guide for FableSpace Images

## Overview

This guide walks you through setting up Cloudflare as a CDN for your Azure Blob Storage images, enabling worldwide fast delivery and 95% cost savings on bandwidth.

## Prerequisites

- ✅ Azure Blob Storage account with images
- ✅ Cloudflare account (free tier works!)
- ✅ Domain managed by Cloudflare DNS
- ✅ Access to Azure Portal

## Step 1: Configure Azure Blob Storage for Public Access

### Option A: Azure Portal (Recommended for Beginners)

1. **Navigate to Storage Account:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Find your storage account (e.g., `fablespacestorage`)

2. **Enable Public Blob Access:**
   - Click on **Containers** in the left menu
   - Select your container (e.g., `fiction-app-dev` or `fiction-app-prod`)
   - Click **Change access level**
   - Select **Blob (anonymous read access for blobs only)**
   - Click **OK**

3. **Configure CORS (Optional but Recommended):**
   - In your storage account, go to **Settings** → **Resource sharing (CORS)**
   - Add a new rule:
     ```
     Allowed origins: *
     Allowed methods: GET, HEAD
     Allowed headers: *
     Exposed headers: *
     Max age: 3600
     ```

### Option B: Azure CLI

```bash
# Set container to public blob access
az storage container set-permission \
  --name fiction-app-prod \
  --public-access blob \
  --account-name <your-storage-account-name>

# Configure CORS
az storage cors add \
  --services b \
  --methods GET HEAD \
  --origins '*' \
  --allowed-headers '*' \
  --exposed-headers '*' \
  --max-age 3600 \
  --account-name <your-storage-account-name>
```

### Verify Public Access

Test that images are publicly accessible:
```bash
# Get your Azure Blob URL from Azure Portal
# Format: https://<account>.blob.core.windows.net/<container>/<path>

# Test with curl
curl -I https://youraccountname.blob.core.windows.net/fiction-app-prod/stories/covers/test.jpg

# Should return: HTTP/1.1 200 OK
```

## Step 2: Set Up Cloudflare DNS

### Create CDN Subdomain

1. **Log in to Cloudflare Dashboard:**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
   - Select your domain (e.g., `fablespace.space`)

2. **Add DNS Record:**
   - Click **DNS** in the left menu
   - Click **Add record**
   - Configure:
     ```
     Type: CNAME
     Name: cdn
     Target: <your-storage-account>.blob.core.windows.net
     Proxy status: Proxied (orange cloud) ✅
     TTL: Auto
     ```
   - Click **Save**

3. **Verify DNS Propagation:**
   ```bash
   # Check DNS resolution
   nslookup cdn.fablespace.space
   
   # Should show Cloudflare IPs (not Azure IPs)
   ```

## Step 3: Configure Cloudflare Caching

### Create Page Rule for Aggressive Caching

1. **Navigate to Page Rules:**
   - In Cloudflare Dashboard, click **Rules** → **Page Rules**
   - Click **Create Page Rule**

2. **Configure Caching Rule:**
   ```
   URL Pattern: cdn.fablespace.space/*
   
   Settings:
   ✅ Cache Level: Cache Everything
   ✅ Edge Cache TTL: 1 year
   ✅ Browser Cache TTL: Respect Existing Headers
   ✅ Origin Cache Control: On
   ```

3. **Click Save and Deploy**

### Alternative: Using Cache Rules (New Method)

If you have access to the new Cache Rules:

1. **Navigate to Cache Rules:**
   - Click **Caching** → **Cache Rules**
   - Click **Create rule**

2. **Configure:**
   ```
   Rule name: CDN Images Cache
   
   When incoming requests match:
   - Hostname equals cdn.fablespace.space
   
   Then:
   - Cache eligibility: Eligible for cache
   - Edge TTL: 1 year
   - Browser TTL: Respect origin
   ```

## Step 4: Enable Cloudflare Optimizations

### Polish (Automatic Image Optimization)

1. **Navigate to Speed:**
   - Click **Speed** → **Optimization**

2. **Enable Polish:**
   - Select **Lossless** (or **Lossy** for smaller files)
   - This automatically:
     - Converts to WebP when browser supports it
     - Strips metadata
     - Compresses images

### Mirage (Lazy Loading)

1. **In Speed → Optimization:**
   - Enable **Mirage**
   - Automatically lazy loads images
   - Shows low-res placeholder first

### Auto Minify (Optional)

- Enable **Auto Minify** for HTML, CSS, JS
- Not needed for images, but good for overall site

## Step 5: Configure Security Settings

### SSL/TLS

1. **Navigate to SSL/TLS:**
   - Click **SSL/TLS** → **Overview**
   - Set to **Full** or **Full (strict)**
   - This ensures HTTPS between Cloudflare and Azure

### Security Level

1. **Navigate to Security:**
   - Click **Security** → **Settings**
   - Set **Security Level** to **Medium**
   - Prevents hotlinking and abuse

### Hotlink Protection (Optional)

Create a WAF rule to prevent hotlinking:

1. **Navigate to Security → WAF:**
   - Click **Create rule**
   - Configure:
     ```
     Rule name: Block Hotlinking
     
     When incoming requests match:
     - Hostname equals cdn.fablespace.space
     - AND Referer does not contain fablespace.space
     - AND Referer is not empty
     
     Then:
     - Action: Block
     ```

## Step 6: Test CDN Configuration

### Test Image Loading

```bash
# Test CDN URL
curl -I https://cdn.fablespace.space/stories/covers/test.jpg

# Check for Cloudflare headers:
# cf-cache-status: HIT (after first request)
# cf-ray: <ray-id>
# cache-control: public, max-age=31536000, immutable
```

### Verify Cache Status

1. **First Request (MISS):**
   ```bash
   curl -I https://cdn.fablespace.space/stories/covers/test.jpg
   # cf-cache-status: MISS
   ```

2. **Second Request (HIT):**
   ```bash
   curl -I https://cdn.fablespace.space/stories/covers/test.jpg
   # cf-cache-status: HIT ✅
   ```

### Test from Browser

1. Open DevTools (F12)
2. Go to Network tab
3. Load a page with images
4. Check image requests:
   - Should show `cf-cache-status: HIT`
   - Fast load times (<100ms)

## Step 7: Monitor Performance

### Cloudflare Analytics

1. **Navigate to Analytics:**
   - Click **Analytics & Logs** → **Traffic**
   - Monitor:
     - Requests per second
     - Bandwidth saved
     - Cache hit ratio (aim for >90%)

2. **Cache Analytics:**
   - Click **Caching** → **Configuration**
   - View cache hit ratio over time

### Set Up Alerts (Optional)

1. **Navigate to Notifications:**
   - Click **Notifications**
   - Create alert for:
     - Low cache hit ratio (<80%)
     - High error rate (>5%)

## Troubleshooting

### Images Not Loading

**Check 1: Azure Blob Access**
```bash
# Test direct Azure URL
curl -I https://youraccountname.blob.core.windows.net/container/image.jpg
# Should return 200 OK
```

**Check 2: DNS Resolution**
```bash
nslookup cdn.fablespace.space
# Should show Cloudflare IPs
```

**Check 3: Cloudflare Proxy**
- Ensure orange cloud is enabled in DNS settings

### Cache Not Working (Always MISS)

**Check 1: Page Rules**
- Verify "Cache Everything" is enabled
- Check URL pattern matches

**Check 2: Query Strings**
- Cloudflare doesn't cache URLs with query strings by default
- Add "Cache Level: Cache Everything" to override

**Check 3: Cookies**
- Cloudflare doesn't cache responses with Set-Cookie headers
- Ensure Azure Blob Storage doesn't send cookies

### CORS Errors

**Fix:** Add CORS headers in Azure Blob Storage (see Step 1)

**Verify:**
```bash
curl -I -H "Origin: https://fablespace.space" \
  https://cdn.fablespace.space/stories/covers/test.jpg
# Should include: Access-Control-Allow-Origin: *
```

## Advanced: Image Resizing (Paid Feature)

Cloudflare offers on-the-fly image resizing (requires paid plan):

### Enable Image Resizing

1. **Upgrade to Pro plan or higher**
2. **Navigate to Speed → Optimization**
3. **Enable Image Resizing**

### Usage

```html
<!-- Original: 2000x1500 -->
<img src="https://cdn.fablespace.space/cdn-cgi/image/width=800,quality=85/stories/cover.jpg" />

<!-- Formats -->
<img src="https://cdn.fablespace.space/cdn-cgi/image/format=webp/stories/cover.jpg" />

<!-- Multiple transformations -->
<img src="https://cdn.fablespace.space/cdn-cgi/image/width=400,height=300,fit=cover,quality=90/stories/cover.jpg" />
```

## Cost Comparison

### Before (Backend Proxy)
- Backend bandwidth: ~$0.10/GB
- Server load: High
- **Total:** $0.10/GB

### After (Cloudflare CDN)
- Azure bandwidth: ~$0.05/GB (only 10% of requests)
- Cloudflare bandwidth: Free (90% of requests)
- **Total:** ~$0.005/GB (95% savings!)

### Example Savings
- 1TB/month traffic
- Before: $100/month
- After: $5/month
- **Savings: $95/month** 💰

## Checklist

- [ ] Azure Blob Storage set to public blob access
- [ ] CORS configured in Azure
- [ ] DNS CNAME created: `cdn.fablespace.space`
- [ ] Cloudflare proxy enabled (orange cloud)
- [ ] Page Rule created for caching
- [ ] Polish enabled for image optimization
- [ ] Mirage enabled for lazy loading
- [ ] SSL/TLS set to Full
- [ ] Tested image loading (cf-cache-status: HIT)
- [ ] Cache hit ratio >90%
- [ ] Frontend code updated (Phase 1)
- [ ] Deployed to production

## Next Steps

After completing this setup:

1. ✅ **Deploy Phase 1** - Frontend code is already updated
2. ⏳ **Monitor for 1 week** - Check cache hit rates and performance
3. ⏳ **Deploy Phase 2** - Update backend upload controller
4. ⏳ **Deploy Phase 3** - Run database migration (optional)

## Support Resources

- [Cloudflare Caching Documentation](https://developers.cloudflare.com/cache/)
- [Azure Blob Storage Public Access](https://learn.microsoft.com/en-us/azure/storage/blobs/anonymous-read-access-configure)
- [Cloudflare Page Rules](https://developers.cloudflare.com/rules/page-rules/)
- [Cloudflare Polish](https://developers.cloudflare.com/images/polish/)

## Summary

You now have:
- ✅ Images served from Cloudflare's global CDN
- ✅ 95% cost savings on bandwidth
- ✅ Automatic image optimization (WebP, compression)
- ✅ Lazy loading for better performance
- ✅ 1-year browser and CDN caching
- ✅ Fast delivery worldwide

Your images will load **instantly** for users around the world! 🚀
