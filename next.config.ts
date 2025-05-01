import type { NextConfig } from 'next';
import { hostname } from 'os';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 'utfs.io',
        port: '',
        protocol: 'https',
      },
    ],
  },
};

export default nextConfig;
