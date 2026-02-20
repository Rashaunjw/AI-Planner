import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  productionBrowserSourceMaps: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
