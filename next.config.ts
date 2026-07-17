import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  // Garante que a allowlist de CPFs entre no bundle serverless (Vercel)
  outputFileTracingIncludes: {
    "/api/participantes/lookup": ["./data/participantes.json"],
    "/api/candidaturas": ["./data/participantes.json"],
  },
};

export default nextConfig;
