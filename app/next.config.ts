import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // swcMinify is deprecated in Next.js 14+; SWC is the default compiler
  images: {
    unoptimized: true, // Required for static export / Cloudflare Pages
  },
  // Enable static generation where possible
  staticPageGenerationTimeout: 120,
  // Optimize for Cloudflare Pages
  experimental: {
    serverMinification: true,
  },
};

export default nextConfig;
