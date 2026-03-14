import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict mode catches double-render bugs in development
  reactStrictMode: true,

  // Security headers applied to every response
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent the page from being embedded in iframes (clickjacking)
          { key: 'X-Frame-Options', value: 'DENY' },
          // Block MIME-type sniffing
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Only send referrer on same-origin requests
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Disable browser features that clinical apps don't need
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=(), payment=()',
          },
          // Basic XSS protection for older browsers
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ];
  },

  // Supabase storage images — allow optimisation via Next/Image
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
