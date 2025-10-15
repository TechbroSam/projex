import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Add this line
      },
    ],
  },
  trailingSlash: true,
  reactStrictMode: true,
};

export default nextConfig;
