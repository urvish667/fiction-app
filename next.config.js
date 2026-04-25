/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Proxy API requests to avoid CORS issues and handle legacy image URLs
  async rewrites() {
    // In development, use localhost. In production, use the API URL.
    const isDev = process.env.NODE_ENV !== 'production';
    const baseUrl = isDev 
      ? 'http://localhost:4000/api/v1' 
      : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.fablespace.space/api/v1');

    return [
      {
        source: '/api/v1/images/:path*',
        destination: `${baseUrl}/images/:path*`,
      },
      {
        // Handle legacy image URLs embedded in chapter HTML content
        source: '/api/images/:path*',
        destination: `${baseUrl}/images/:path*`,
      },
    ]
  },

  // Configure headers for security and caching
  async headers() {
    return [
      // Security headers for all pages
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      // Long-term caching for Next.js static assets
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Long-term caching for public static files
      {
        source: '/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Disable TypeScript type checking during build
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  // Enable standalone output mode for Docker
  output: 'standalone',
}

module.exports = nextConfig
