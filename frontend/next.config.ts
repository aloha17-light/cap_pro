import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://40.192.35.102:5000/api/:path*'
      }
    ];
  }
};

export default nextConfig;
