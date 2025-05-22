import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "d27z25zrx6g82w.cloudfront.net",
      },
    ],
  },
};

export default nextConfig;
