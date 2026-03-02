import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    deviceSizes: [320, 420, 640, 750, 828, 1080],
    imageSizes: [96, 128, 192, 256, 384],
  },
};

export default nextConfig;
