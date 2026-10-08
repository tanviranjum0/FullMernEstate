import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Embeddable virtual-tour / video providers. Anything else is linked, not framed.
const frameSources = [
  "https://www.youtube-nocookie.com",
  "https://www.youtube.com",
  "https://player.vimeo.com",
  "https://my.matterport.com",
  "https://kuula.co",
  "https://momento360.com",
];

const imageSources = [
  "https://*.public.blob.vercel-storage.com",
  "https://images.unsplash.com",
  "https://res.cloudinary.com",
];

// A nonce-based CSP would force every route to render dynamically and is incompatible with
// partial prerendering, so inline scripts are allowed while every other source is pinned.
const contentSecurityPolicy = [
  "default-src 'self'",
  // In development Vercel Analytics loads debug builds from its CDN; in production they are same-origin.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' https://va.vercel-scripts.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${imageSources.join(" ")}`,
  "media-src 'self' https://*.public.blob.vercel-storage.com",
  "font-src 'self'",
  "connect-src 'self' https://tiles.openfreemap.org",
  "worker-src 'self' blob:",
  `frame-src ${frameSources.join(" ")}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  // With Partial Prefetching, a slug that was not prerendered is answered with the route's
  // App Shell (HTTP 200) before the page can call notFound(). Without it, detail pages behave
  // like `fallback: 'blocking'`: unknown listings, guides and articles return a real 404, and
  // the first request for a newly published one waits for its full, crawlable HTML.
  partialPrefetching: false,
  reactCompiler: true,
  poweredByHeader: false,
  images: {
    loader: "custom",
    loaderFile: "./src/lib/media/image-loader.ts",
    deviceSizes: [640, 960, 1280, 1920, 2560],
    imageSizes: [160, 320, 480],
    qualities: [70, 80],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/search", destination: "/properties", permanent: true },
      { source: "/login", destination: "/sign-in", permanent: true },
      { source: "/create-listing", destination: "/admin/properties/new", permanent: true },
    ];
  },
};

export default nextConfig;
