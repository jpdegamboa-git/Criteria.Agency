import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Standalone output for Docker/self-hosted. Vercel ignores this.
  output: process.env.VERCEL ? undefined : "standalone",
};

export default nextConfig;
