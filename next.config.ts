import type { NextConfig } from "next";

// Content-Security-Policy en modo "Report-Only": NO bloquea nada, solo reporta
// en la consola del navegador lo que se saldría de la política. Cuando el sitio
// esté publicado y la consola esté limpia, cambia la cabecera a
// "Content-Security-Policy" para activarla.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://connect.facebook.net https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms",
  // Compresor de video del admin (ffmpeg.wasm) corre en un worker
  "worker-src 'self' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.cdninstagram.com https://*.fbcdn.net https://www.facebook.com https://*.google-analytics.com https://*.googletagmanager.com https://*.clarity.ms https://c.bing.com",
  "media-src 'self' blob: https://*.supabase.co https://*.cdninstagram.com https://*.fbcdn.net",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://connect.facebook.net https://www.facebook.com https://cdn.jsdelivr.net https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms",
  "frame-src https://www.google.com https://maps.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.1.116", "192.168.1.116:3000"],

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            // Fuerza HTTPS durante 2 años (los navegadores lo ignoran en http://localhost)
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: CSP,
          },
        ],
      },
    ];
  },

  images: {
    // 1. Formatos prioritarios de compresión sin pérdida visual
    formats: ["image/avif", "image/webp"],

    // 2. Calidades disponibles (incluye 95 para piezas arquitectónicas clave)
    // Sin 75: cualquier <Image> sin `quality` usa la más cercana (85).
    // Así todo el sitio sale en alta calidad por defecto; 90/95 para piezas clave.
    qualities: [85, 90, 95],

    // 3. Puntos de corte para evitar que imágenes a 50vw o 100vw se pixelen en pantallas 2K/4K
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // 4. Cachea la optimización en el servidor/CDN durante 1 año
    minimumCacheTTL: 31536000,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "zwgiwcqrymqaqoadbhta.supabase.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/**",
      },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
