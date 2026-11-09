import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // images and clips rarely change; let browsers and the CDN keep them for a week and refresh in the background
  async headers() {
    const cache = [{ key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' }];
    return [{ source: '/img/:path*', headers: cache }, { source: '/motion/:path*', headers: cache }];
  },
};

export default nextConfig;
