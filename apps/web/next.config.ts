import type { NextConfig } from "next";

const baseConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "drive.google.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

// En desarrollo exportamos la config base directamente (sin webpack config de PWA)
// para que Turbopack funcione. En producción se usa next-pwa via next.config.prod.mjs
export default baseConfig;
