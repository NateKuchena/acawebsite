import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Production optimizations
  poweredByHeader: false,
  compress: true,
  // Strict mode for catching potential issues
  reactStrictMode: true,
};

export default nextConfig;
