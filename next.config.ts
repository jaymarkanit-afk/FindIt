import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
// Vercel preview deployments show the Vercel Toolbar (comments), which needs
// these sources: https://vercel.com/docs/vercel-toolbar/managing-toolbar
const isPreview = process.env.VERCEL_ENV === "preview";
const toolbar = (sources: string) => (isPreview ? ` ${sources}` : "");

// No nonces, so pages stay cacheable; Next.js (and Leaflet) need
// 'unsafe-inline' for inline scripts and styles. Map tiles come from
// OpenStreetMap's tile server (src/lib/map.ts, TILE_URL).
const MAP_TILES = "https://tile.openstreetmap.org";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${toolbar("https://vercel.live")}`,
  `style-src 'self' 'unsafe-inline'${toolbar("https://vercel.live")}`,
  `img-src 'self' blob: data: https://images.unsplash.com ${MAP_TILES}${toolbar("https://vercel.live https://vercel.com")}`,
  `font-src 'self'${toolbar("https://vercel.live https://assets.vercel.com")}`,
  `connect-src 'self'${toolbar("https://vercel.live wss://ws-us3.pusher.com")}`,
  `frame-src ${isPreview ? "https://vercel.live" : "'none'"}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Geolocation stays available to the app itself for "use my location"
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com", pathname: "/photo-*" }],
  },
  async redirects() {
    // Old app addresses. Temporary (307) while the old app can still be
    // rolled back to; make them permanent once the migration is final.
    return [
      { source: "/findit", destination: "/", permanent: false },
      { source: "/findit.html", destination: "/", permanent: false },
      { source: "/index.html", destination: "/", permanent: false },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Café photos rarely change; the old vercel.json cached them for a week
      { source: "/Images/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=604800" }] },
    ];
  },
};

export default nextConfig;
