import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The site deploys to Vercel as a static export — Vercel auto-detects
   * Next.js with `output: "export"` and serves `out/`, so no vercel.json
   * is needed. Every route here already prerenders from markdown.
   */
  output: "export",
  /* The export has no image optimiser at runtime, so <Image> must emit the
     files as they are. */
  images: { unoptimized: true },
  /* Empty for the custom-domain (root) deployment; set it to build the site
     under a sub-path without touching any <Link> or <Image>. */
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "",
  /**
   * Let the dev server be opened from other devices on the LAN
   * (e.g. a phone at http://192.168.1.15:3000). Without this Next blocks
   * cross-origin requests to /_next/*, so no JS loads and the page renders
   * but never hydrates. Development only — ignored in production builds.
   */
  allowedDevOrigins: ["192.168.1.*", "*.local"],
  /**
   * cacheComponents is off deliberately. Every route here renders from
   * markdown on disk at build time, so there is no dynamic data for it to
   * help with — and it forbids reading the clock during prerender, which
   * the Shiki highlighter does internally. Keeping it on required an
   * `instant = false` escape hatch and blocked `dynamicParams`. Off, every
   * page is plain static. partialPrefetching depends on it, so it goes too.
   */
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
