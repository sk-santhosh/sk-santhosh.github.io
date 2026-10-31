import type { Metadata } from "next";
import { pages, site } from "@/data/content";

/**
 * Absolute origin for metadata, canonical URLs, the sitemap, robots and the
 * feeds. Env-driven so a preview deployment or a sub-path build describes
 * itself correctly instead of claiming the production domain.
 */
export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  `${site.url}${process.env.NEXT_PUBLIC_BASE_PATH || ""}`;

/** Google Search Console "HTML tag" verification token. Omitted when unset. */
export const googleSiteVerification =
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

/** GA4 measurement ID. Unset in local dev, so dev traffic never reaches it. */
export const gaId = process.env.NEXT_PUBLIC_GA_ID;

/**
 * Metadata is inherited from the root layout, so a page that only sets
 * `title`/`description` keeps the root's Open Graph title and — worse —
 * its canonical URL. These helpers restate both per route, so every
 * shared link carries the copy and the card belonging to that page.
 */

type Route = keyof typeof pages;

export function routeMetadata(route: Route): Metadata {
  const page = pages[route];
  return sharedMetadata({
    path: route,
    title: page.title,
    description: page.description,
  });
}

export function sharedMetadata({
  path,
  title,
  description,
}: {
  path: string;
  title: string;
  description: string;
}): Metadata {
  const full = `${title} · ${site.fullName}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { url: path, title: full, description },
    twitter: { title: full, description },
  };
}
