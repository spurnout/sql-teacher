import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "1gb",
    },
  },
};

export default nextConfig;
