import type { MetadataRoute } from "next";
import { getAllBlogs } from "@/lib/blogs";
import { siteUrl } from "@/lib/site";

// Required for `output: "export"` — emit a static sitemap.xml at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/about`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/blogs`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
  ];

  const blogRoutes: MetadataRoute.Sitemap = getAllBlogs().map((post) => ({
    url: `${siteUrl}/blogs/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "daily",
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
