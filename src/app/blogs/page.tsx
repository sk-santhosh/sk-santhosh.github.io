import type { Metadata } from "next";
import Blog from "@/components/Blog";
import PageShell from "@/components/PageShell";
import { pages } from "@/data/content";
import { getPosts } from "@/lib/content";
import { routeMetadata } from "@/lib/seo";

const page = pages["/blogs"];

export const metadata: Metadata = routeMetadata("/blogs");

export default function BlogPage() {
  return (
    <PageShell
      index={page.index}
      title={page.title}
      lede={page.lede}
    >
      <Blog posts={getPosts()} />
    </PageShell>
  );
}
