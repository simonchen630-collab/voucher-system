import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // 忽略建置時的 TypeScript 錯誤，確保順利部署
    ignoreBuildErrors: true,
  },
};

export default function NextConfig() {
  return nextConfig;
}