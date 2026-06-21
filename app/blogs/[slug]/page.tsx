import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import type { Metadata } from "next";
import { getAllBlogs, getBlogBySlug, formatDate } from "@/lib/blogs";
import { tagColor } from "@/lib/tag-colors";
import { siteUrl } from "@/lib/site";
import { resume } from "@/data/resume";

export async function generateStaticParams() {
  return getAllBlogs().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return {};
  const url = `${siteUrl}/blogs/${slug}`;
  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: resume.name, url: siteUrl }],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: post.title,
      description: post.description,
      siteName: resume.name,
      publishedTime: post.date,
      authors: [resume.name],
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    keywords: post.tags.join(", "),
    image: `${siteUrl}/og.png`,
    url: `${siteUrl}/blogs/${slug}`,
    mainEntityOfPage: `${siteUrl}/blogs/${slug}`,
    author: { "@type": "Person", name: resume.name, url: siteUrl },
    publisher: { "@type": "Person", name: resume.name, url: siteUrl },
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <Link
        href="/blogs"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors mb-8 min-h-[44px]"
      >
        <ArrowLeft size={14} /> All posts
      </Link>

      <header className="mb-8 pb-6 border-b border-slate-100 dark:border-slate-800">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 leading-snug mb-2">
          {post.title}
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">{post.description}</p>
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <Calendar size={12} className="text-blue-400" />
            <time>{formatDate(post.date)}</time>
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {post.tags.map((tag) => (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded border ${tagColor(tag)}`}>
                {tag}
              </span>
            ))}
          </div>
        </div>
      </header>

      <div className="prose" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
