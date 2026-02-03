import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    unoptimized: true, // Required for static export / Cloudflare Pages
  },
  // Enable static generation where possible
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
