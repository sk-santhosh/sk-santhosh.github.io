import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleShell from "@/components/ArticleShell";
import { ArrowUpRight } from "@/components/Icons";
import { site } from "@/data/content";
import { getPost, getPosts } from "@/lib/content";
import { sharedMetadata, siteUrl } from "@/lib/seo";

/* Only the slugs below exist; anything else is a 404 rather than an
   attempted render. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map((p) => ({ slug: p.slug }));
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export async function generateMetadata({
  params,
}: PageProps<"/blogs/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return sharedMetadata({
    path: `/blogs/${slug}`,
    title: post.title,
    description: post.excerpt,
  });
}

export default async function PostPage({ params }: PageProps<"/blogs/[slug]">) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  /* Posts sharing the most tags, recency breaking ties — the markdown
     cross-links between posts, so the list keeps that thread visible. */
  const related = getPosts()
    .filter((p) => p.slug !== post.slug)
    .map((p, recency) => ({
      post: p,
      overlap: p.tags.filter((t) => post.tags.includes(t)).length,
      recency,
    }))
    .filter(({ overlap }) => overlap > 0)
    .sort((a, b) => b.overlap - a.overlap || a.recency - b.recency)
    .slice(0, 3)
    .map(({ post: p }) => p);

  /* References the Person/WebSite entities declared once in the layout
     rather than restating the author on every post. */
  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "@id": `${siteUrl}/blogs/${post.slug}#post`,
      headline: post.title,
      description: post.excerpt,
      datePublished: post.date,
      dateModified: post.date,
      url: `${siteUrl}/blogs/${post.slug}`,
      mainEntityOfPage: `${siteUrl}/blogs/${post.slug}`,
      keywords: post.tags.join(", "),
      inLanguage: "en",
      author: { "@id": `${siteUrl}/#person` },
      publisher: { "@id": `${siteUrl}/#person` },
      isPartOf: { "@id": `${siteUrl}/#website` },
      image: `${siteUrl}/blogs/${post.slug}/opengraph-image/og`,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.fullName, item: siteUrl },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blogs",
          item: `${siteUrl}/blogs`,
        },
        { "@type": "ListItem", position: 3, name: post.title },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <ArticleShell
      backHref="/blogs"
      backLabel="All writing"
      eyebrow={`${post.category} · ${fmt(post.date)} · ${post.readingTime}`}
      title={post.title}
      lede={post.excerpt}
      aside={
        <>
          {post.tags.length > 0 && (
            <div>
              <h2 className="label text-ink-mute">Topics</h2>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <li
                    key={t}
                    className="border border-rule px-2 py-1 text-[11.5px] text-ink-soft"
                  >
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {related.length > 0 && (
            <div className="border-t border-rule pt-6">
              <h2 className="label text-ink-mute">Related</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {related.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/blogs/${p.slug}`}
                      className="text-[13.5px] leading-snug text-ink transition-colors hover:text-flame-600"
                    >
                      {p.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      }
      footer={
        <Link
          href="/contact"
          className="group inline-flex items-center gap-2 bg-flame-700 px-6 py-4 text-[14px] font-semibold text-white transition-colors hover:bg-flame-600"
        >
          Talk to me about work like this
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      }
      html={post.html}
      />
    </>
  );
}
