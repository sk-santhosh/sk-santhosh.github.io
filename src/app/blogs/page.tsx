import type { Metadata } from "next";
import Blog from "@/components/Blog";
import PageShell from "@/components/PageShell";
import { pages, site } from "@/data/content";
import { getPosts } from "@/lib/content";
import { routeMetadata, siteUrl } from "@/lib/seo";

const page = pages["/blogs"];

export const metadata: Metadata = routeMetadata("/blogs");

export default function BlogPage() {
  const posts = getPosts();

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${siteUrl}/blogs#blog`,
      url: `${siteUrl}/blogs`,
      name: `${site.fullName} — Writing`,
      description: page.description,
      publisher: { "@id": `${siteUrl}/#person` },
      isPartOf: { "@id": `${siteUrl}/#website` },
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        url: `${siteUrl}/blogs/${p.slug}`,
        datePublished: p.date,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.fullName, item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Blogs", item: `${siteUrl}/blogs` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageShell
        index={page.index}
        title={page.title}
        lede={page.lede}
      >
        <Blog posts={posts} />
      </PageShell>
    </>
  );
}
