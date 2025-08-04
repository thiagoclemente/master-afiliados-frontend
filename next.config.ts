import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        hostname: "d27z25zrx6g82w.cloudfront.net",
      },
      {
        hostname: "s3.masterafiliados.com.br",
      },
      {
        hostname: "localhost",
      },
      {
        hostname: "api.masterafiliados.com.br",
      }
    ],
  },
};

export default nextConfig;
