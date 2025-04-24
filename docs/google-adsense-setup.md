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

The Google AdSense script is loaded in the root layout component (`src/app/layout.tsx`) using Next.js's `Script` component. The script is only loaded in production mode to avoid development issues.

```tsx
{process.env.NODE_ENV === 'production' && (
  <Script
    id="google-adsense"
    async
    strategy="afterInteractive"
    src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
    crossOrigin="anonymous"
  />
)}
```

## Ad Placement

FableSpace already has ad components in place throughout the application:

1. **Banner Ads**: Fixed at the bottom of story and chapter pages
2. **Interstitial Ads**: Placed between content sections on story and chapter pages
3. **Sidebar Ads**: Available for placement in sidebar components

These ad components use the `AdBanner` component (`src/components/ad-banner.tsx`), which is currently implemented as a placeholder. With Google AdSense now integrated, these placeholders will be automatically filled with real ads when the AdSense account is approved.

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

## Further Resources

- [Google AdSense Help Center](https://support.google.com/adsense/)
- [AdSense Program Policies](https://support.google.com/adsense/answer/48182)
- [Next.js Script Component Documentation](https://nextjs.org/docs/app/building-your-application/optimizing/scripts)
