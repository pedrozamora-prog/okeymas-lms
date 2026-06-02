// Usado en producción: NEXT_CONFIG=prod pnpm build
// Este archivo añade la capa PWA (webpack) que no es compatible con Turbopack en dev.
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest:          "public",
  register:      true,
  skipWaiting:   true,
  reloadOnOnline: true,
  workboxOptions: {
    runtimeCaching: [
      {
        urlPattern: /^https?.*/,
        handler: "NetworkFirst",
        options: {
          cacheName: "fitacademy-app",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
          networkTimeoutSeconds: 10,
        },
      },
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "fitacademy-images",
          expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
        },
      },
      {
        urlPattern: /\/api\/(courses|lessons|dashboard)/,
        handler: "NetworkFirst",
        options: {
          cacheName: "fitacademy-api",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
          networkTimeoutSeconds: 5,
        },
      },
    ],
  },
});

/** @type {import('next').NextConfig} */
const baseConfig = {
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

export default withPWA(baseConfig);
