import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Only emit the standalone server bundle when self-hosting (Docker).
  // On Vercel (VERCEL=1 at build time), standalone mode prevents route
  // handlers from being registered as serverless functions, which makes
  // /api/* return a cached static 404. Let Vercel build normally there.
  output: process.env.VERCEL ? undefined : "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS images for flexibility with Vercel Blob and external sources
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
