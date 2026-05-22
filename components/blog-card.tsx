import Link from "next/link";
import { ArrowUpRight, Calendar } from "lucide-react";
import { formatDate } from "@/lib/blogs";
import type { BlogMeta } from "@/lib/blogs";
import { tagColor } from "@/lib/tag-colors";

export default function BlogCard({ post }: { post: BlogMeta }) {
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group flex items-start justify-between py-4 gap-4 hover:bg-slate-50 dark:hover:bg-slate-900 active:bg-slate-100 dark:active:bg-slate-800 -mx-2 px-2 rounded-md transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0"
    >
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
          {post.title}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 sm:line-clamp-1">{post.description}</p>
        <div className="flex items-center gap-1.5 flex-wrap">
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className={`text-xs px-2 py-0.5 rounded border ${tagColor(tag)}`}>
              {tag}
            </span>
          ))}
          {post.tags.length > 3 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">+{post.tags.length - 3}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 sm:hidden">
          <Calendar size={11} className="text-slate-400 dark:text-slate-500" />
          <time className="text-xs text-slate-400 dark:text-slate-500">{formatDate(post.date)}</time>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-1.5 shrink-0 mt-0.5">
        <Calendar size={12} className="text-slate-400 dark:text-slate-500" />
        <time className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">{formatDate(post.date)}</time>
        <ArrowUpRight size={12} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors ml-0.5" />
      </div>
      <ArrowUpRight size={12} className="sm:hidden shrink-0 mt-0.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 transition-colors" />
    </Link>
  );
}
