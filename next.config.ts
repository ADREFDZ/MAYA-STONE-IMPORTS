import type { NextConfig } from "next";

// Content-Security-Policy en modo "Report-Only": NO bloquea nada, solo reporta
// en la consola del navegador lo que se saldría de la política. Cuando el sitio
// esté publicado y la consola esté limpia, cambia la cabecera a
// "Content-Security-Policy" para activarla.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://connect.facebook.net",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://*.cdninstagram.com https://*.fbcdn.net https://www.facebook.com",
  "media-src 'self' blob: https://*.supabase.co https://*.cdninstagram.com https://*.fbcdn.net",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://connect.facebook.net https://www.facebook.com",
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
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
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
    // Habilita las calidades personalizadas para eliminar la advertencia de Next.js
    qualities: [75, 85, 90],
    formats: ["image/avif", "image/webp"],
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
