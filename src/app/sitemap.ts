import type { MetadataRoute } from "next";
import { nav } from "@/data/content";
import { siteUrl } from "@/lib/seo";
import { getPosts, getProjects } from "@/lib/content";

/* Required by `output: "export"` — emitted at build time. */
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = nav.map((item) => ({
    url: `${siteUrl}${item.href === "/" ? "" : item.href}`,
    changeFrequency: "monthly" as const,
    priority: item.href === "/" ? 1 : 0.8,
  }));

  const projects = getProjects().map((p) => ({
    url: `${siteUrl}/projects/${p.slug}`,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const posts = getPosts().map((p) => ({
    url: `${siteUrl}/blogs/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...pages, ...projects, ...posts];
}
