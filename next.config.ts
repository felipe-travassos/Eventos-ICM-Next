import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/fir-auth-article-42d79.appspot.com/o/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
    dirs: [
      'src/app',
      'src/components',
      'src/contexts',
      'src/lib',
      'src/providers',
      'src/types',
      'src/utils',
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
