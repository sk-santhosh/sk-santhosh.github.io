import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { common } from "lowlight";
import type { LanguageFn } from "highlight.js";
import nginx from "highlight.js/lib/languages/nginx";

const BLOGS_DIR = path.join(process.cwd(), "content/blogs");

// highlight.js doesn't bundle HCL/Terraform, so register a compact grammar.
const hcl: LanguageFn = (hljs) => ({
  name: "Terraform",
  aliases: ["tf", "terraform"],
  keywords: {
    keyword:
      "resource variable provider output module data terraform locals dynamic lifecycle for_each count depends_on for in if else",
    literal: "true false null",
  },
  contains: [
    hljs.COMMENT("#", "$"),
    hljs.COMMENT("//", "$"),
    hljs.COMMENT("/\\*", "\\*/"),
    {
      className: "string",
      begin: '"',
      end: '"',
      contains: [
        hljs.BACKSLASH_ESCAPE,
        {
          className: "subst",
          begin: /\$\{/,
          end: /\}/,
          keywords: { built_in: "var local module data path count each self" },
        },
      ],
    },
    { className: "number", begin: /\b\d+(\.\d+)?\b/, relevance: 0 },
    // attribute name:  foo =
    {
      className: "attr",
      begin: /[a-zA-Z_][a-zA-Z0-9_-]*(?=\s*=[^=])/,
      relevance: 0,
    },
    // function call:  cidrsubnet(
    { className: "built_in", begin: /[a-zA-Z_]\w*(?=\()/, relevance: 0 },
  ],
});

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** Optional last-updated date from frontmatter; falls back to `date`. */
  updated?: string;
  tags: string[];
  wordCount: number;
  /** Estimated reading time in whole minutes (min 1). */
  readingTime: number;
  content: string;
}

export type BlogMeta = Omit<BlogPost, "content">;

function parseDate(dateStr: string): Date {
  return new Date(dateStr);
}

const WORDS_PER_MINUTE = 220;

function countWords(markdown: string): number {
  // Strip fenced code blocks and inline markup noise before counting so the
  // estimate tracks prose, not code density.
  const prose = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*_>`~\[\]()]/g, " ");
  return prose.split(/\s+/).filter(Boolean).length;
}

function readingTimeMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));
}

// rehype plugin: make article images lazy — they are always below the fold
// (the post header comes first), so lazy-loading them protects LCP.
interface HastNode {
  type: string;
  tagName?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
}

function rehypeLazyImages() {
  return (tree: HastNode) => {
    const visit = (node: HastNode) => {
      if (node.type === "element" && node.tagName === "img") {
        node.properties = {
          ...node.properties,
          loading: "lazy",
          decoding: "async",
        };
      }
      node.children?.forEach(visit);
    };
    visit(tree);
  };
}

export function getAllBlogs(): BlogMeta[] {
  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(BLOGS_DIR, filename), "utf8");
      const { data, content } = matter(raw);
      const wordCount = countWords(content);

      return {
        slug,
        title: data.title as string,
        description: data.description as string,
        date: data.date as string,
        updated: data.updated as string | undefined,
        tags: (data.tags as string[]) ?? [],
        wordCount,
        readingTime: readingTimeMinutes(wordCount),
      };
    })
    .sort((a, b) => parseDate(b.date).getTime() - parseDate(a.date).getTime());
}

// Previous/next posts in the date-sorted list (newest first). "Previous" is
// the newer neighbour, "next" the older one — matching reading order on the
// blog index.
export function getAdjacentBlogs(slug: string): {
  previous: BlogMeta | null;
  next: BlogMeta | null;
} {
  const all = getAllBlogs();
  const i = all.findIndex((p) => p.slug === slug);
  if (i === -1) return { previous: null, next: null };
  return {
    previous: i > 0 ? all[i - 1] : null,
    next: i < all.length - 1 ? all[i + 1] : null,
  };
}

// Posts sharing the most tags with the given post; recency breaks ties.
// Falls back to the most recent posts when nothing shares a tag.
export function getRelatedBlogs(slug: string, tags: string[], limit = 3): BlogMeta[] {
  const others = getAllBlogs().filter((p) => p.slug !== slug);
  const tagSet = new Set(tags);
  return others
    .map((p, recency) => ({
      post: p,
      overlap: p.tags.filter((t) => tagSet.has(t)).length,
      recency,
    }))
    .sort((a, b) => b.overlap - a.overlap || a.recency - b.recency)
    .slice(0, limit)
    .map(({ post }) => post);
}

export async function getBlogBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOGS_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const wordCount = countWords(content);

  const processed = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight, {
      detect: true,
      // `languages` replaces the default set, so spread `common` to keep
      // json/yaml/bash/javascript/typescript and add Terraform + nginx.
      languages: { ...common, hcl, terraform: hcl, tf: hcl, nginx },
    })
    .use(rehypeLazyImages)
    .use(rehypeStringify)
    .process(content);

  return {
    slug,
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    updated: data.updated as string | undefined,
    tags: (data.tags as string[]) ?? [],
    wordCount,
    readingTime: readingTimeMinutes(wordCount),
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
