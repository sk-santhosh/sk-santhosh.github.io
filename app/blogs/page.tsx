import BlogCard from "@/components/blog-card";
import { getAllBlogs } from "@/lib/blogs";
import { siteUrl } from "@/lib/site";
import { resume } from "@/data/resume";
import { BookOpen } from "lucide-react";

const description =
  "Thoughts on DevOps, Software Engineering, and tech experiments.";

export const metadata = {
  title: "Blogs",
  description,
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "Blogs",
    description,
    url: `${siteUrl}/blogs`,
    type: "website",
  },
};

export default function BlogsPage() {
  const posts = getAllBlogs();

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${siteUrl}/blogs#blog`,
    name: `${resume.name} — Blog`,
    description,
    url: `${siteUrl}/blogs`,
    inLanguage: "en",
    author: { "@id": `${siteUrl}/#person` },
    publisher: { "@id": `${siteUrl}/#person` },
    blogPost: posts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      url: `${siteUrl}/blogs/${post.slug}`,
      datePublished: post.date,
      keywords: post.tags.join(", "),
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Blogs", item: `${siteUrl}/blogs` },
    ],
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="flex items-center gap-2 mb-1">
        <BookOpen size={15} className="text-slate-400" aria-hidden="true" />
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
