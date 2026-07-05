import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // AVIF trava o otimizador neste ambiente; WebP responde normalmente.
    formats: ["image/webp"],
  },
};

export default nextConfig;
