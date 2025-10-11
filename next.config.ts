import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Ensure query parameters are properly handled for SEO
  // Browse pages with query params are server-side rendered for Google indexing
  experimental: {
    // Enable optimized package imports for better performance
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};

export default nextConfig;
