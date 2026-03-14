import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use a short distDir only for local Windows builds to mitigate MAX_PATH limitations.
  // Vercel and other Linux environments should use the default '.next' directory.
  distDir: process.env.VERCEL ? undefined : ".build",
  images: {
    // Allow blob: URLs for local image previews
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
