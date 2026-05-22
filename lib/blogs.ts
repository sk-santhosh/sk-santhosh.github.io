import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";

const BLOGS_DIR = path.join(process.cwd(), "content/blogs");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  content: string;
}

export interface BlogMeta extends Omit<BlogPost, "content"> {}

function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

export function getAllBlogs(): BlogMeta[] {
  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(BLOGS_DIR, filename), "utf8");
      const { data } = matter(raw);

      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        date: data.date as string,
        tags: (data.tags as string[]) ?? [],
      };
    })
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOGS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const processed = await remark().use(html).process(content);

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    tags: (data.tags as string[]) ?? [],
    content: processed.toString(),
  };
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });
}
