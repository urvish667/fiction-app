# Google AdSense Integration for FableSpace

This document explains how Google AdSense has been integrated into the FableSpace application and how to configure it.

## Overview

Google AdSense is a program run by Google through which website publishers can serve ads on their websites and earn money when visitors view or click on the ads. FableSpace has been configured to support Google AdSense throughout the application.

## Configuration

### Environment Variables

The Google AdSense integration uses the following environment variable:

```
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-xxxxxxxxxxxxxxxx
```

Replace `ca-pub-xxxxxxxxxxxxxxxx` with your actual Google AdSense Publisher ID. This ID is provided by Google when you create an AdSense account.

### Implementation Details

The Google AdSense script is loaded in the root layout component (`src/app/layout.tsx`) using a standard HTML script tag in the head section. This approach avoids Next.js Script component issues with the `data-nscript` attribute that AdSense doesn't support.

```tsx
{process.env.NODE_ENV === 'production' && (
  <script
    async
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
    crossOrigin="anonymous"
  />
)}
```

### Content Security Policy (CSP)

The application's CSP has been configured with comprehensive Google AdSense support. Google uses multiple domains that can change over time, so we've included wildcard patterns to handle current and future domains:

**Script Sources (`script-src`):**
- `*.googlesyndication.com` - Main AdSense scripts
- `*.doubleclick.net` - DoubleClick ad serving
- `*.adtrafficquality.google` - Ad quality monitoring (e.g., ep1, ep2, etc.)
- `*.googleadservices.com` - Google ad services

**Connection Sources (`connect-src`):**
- All of the above plus `*.google.com` for API calls

**Frame Sources (`frame-src`):**
- `*.googlesyndication.com` and `*.doubleclick.net` for ad iframes
- `*.adtrafficquality.google` for ad quality monitoring frames
- `www.google.com` for Google services frames

**Why CSP Violations Keep Happening:**
Google AdSense uses dynamic subdomains (like `ep1.adtrafficquality.google`, `ep2.adtrafficquality.google`, etc.) that can change over time. The comprehensive wildcard patterns now included should prevent future violations as Google adds new subdomains.

**Alternative: Strict CSP (Recommended by Google):**
Google officially recommends using "strict CSP" with nonces instead of domain allowlists, as domains change frequently. If you continue experiencing issues, consider implementing strict CSP:

```http
Content-Security-Policy: object-src 'none'; script-src 'nonce-{random}' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https: http:; base-uri 'none';
```

This approach requires adding a nonce to all script tags but eliminates the need to maintain domain lists.

## Ad Placement

FableSpace already has ad components in place throughout the application:

1. **Banner Ads**: Fixed at the bottom of story and chapter pages
2. **Interstitial Ads**: Placed between content sections on story and chapter pages
3. **Sidebar Ads**: Available for placement in sidebar components

These ad components use the `AdBanner` component (`src/components/ad-banner.tsx`), which automatically integrates with Google AdSense in production. The component supports the following props:

- `type`: The type of ad ("banner", "interstitial", or "sidebar")
- `className`: Additional CSS classes for styling
- `slot`: The AdSense ad slot ID (required for production ads)

### Usage Example

```tsx
// Development - shows placeholder
<AdBanner type="banner" className="my-4" />

// Production - shows real AdSense ad
<AdBanner
  type="banner"
  className="my-4"
  slot="1234567890"
/>
```

### Getting Ad Slot IDs

Once your AdSense account is approved:
1. Go to your AdSense dashboard
2. Navigate to "Ads" > "By ad unit"
3. Create new ad units for each placement
4. Copy the ad slot IDs and use them in your AdBanner components

## Verification and Approval

After setting up your AdSense account and adding your Publisher ID to the environment variables, you'll need to verify your site ownership and wait for Google's approval:

1. Create a Google AdSense account if you don't have one
2. Add your website to your AdSense account
3. Set the `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` environment variable with your Publisher ID
4. Deploy your application
5. Complete Google's verification process (this may involve adding a verification file or meta tag)
6. Wait for Google's approval (this can take a few days to a few weeks)

## Ad Customization

You can customize the appearance and behavior of your ads through the Google AdSense dashboard. This includes:

- Ad sizes and formats
- Ad types (text, display, etc.)
- Ad placement rules
- Content categories to allow or block

## Compliance Considerations

When using Google AdSense, ensure your site complies with Google's policies:

1. **Privacy Policy**: Update your privacy policy to disclose the use of Google AdSense
2. **Cookie Consent**: Implement a cookie consent mechanism if required in your jurisdiction
3. **Content Guidelines**: Ensure your content complies with AdSense Program Policies

## Troubleshooting

If ads are not appearing:

1. Verify that your AdSense account is approved
2. Check that the correct Publisher ID is set in the environment variables
3. Ensure the site is deployed in production mode
4. Look for any errors in the browser console
5. Check the AdSense dashboard for any policy violations or account issues

### Common Issues

**CSP Violations**: If you see Content Security Policy errors in the console, ensure that the CSP configuration in `src/lib/security/headers.ts` includes all necessary Google AdSense domains.

**Script Loading Issues**: Use a standard HTML `<script>` tag instead of Next.js `<Script>` component to avoid `data-nscript` attribute issues that AdSense doesn't support.

**Ad Slot Errors**: Make sure you're providing valid ad slot IDs to the AdBanner component in production. Without slot IDs, only placeholder ads will be shown.

**Development vs Production**: Ads only load in production mode. In development, you'll see placeholder ads regardless of your configuration.

## Further Resources

- [Google AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [Next.js Script Component Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
