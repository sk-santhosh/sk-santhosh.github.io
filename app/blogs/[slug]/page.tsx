import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { getAllBlogs, getBlogBySlug, formatDate } from "@/lib/blogs";
import { tagColor } from "@/lib/tag-colors";

export async function generateStaticParams() {
  return getAllBlogs().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) return {};
  return { title: `${post.title} — Santhosh Kumar J`, description: post.description };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug);
  if (!post) notFound();

  return (
    <article>
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
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-4">{post.description}</p>
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
