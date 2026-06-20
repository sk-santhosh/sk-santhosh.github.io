import BlogCard from "@/components/blog-card";
import { getAllBlogs } from "@/lib/blogs";
import { BookOpen } from "lucide-react";

export const metadata = {
  title: "Blogs — Santhosh J",
  description: "Thoughts on DevOps, Software Engineering, and tech experiments.",
};

export default function BlogsPage() {
  const posts = getAllBlogs();

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={15} className="text-blue-400" />
        <h1 className="text-base font-bold text-slate-900 dark:text-slate-100">Blogs</h1>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
        Thoughts on DevOps, Software Engineering, and homelab experiments.
      </p>
      <div>
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}
