import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  allowedDevOrigins: ['192.168.0.159'],
};

export default nextConfig;
