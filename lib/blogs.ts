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

  const processed = await unified()
    .use(remarkParse)
    .use(remarkRehype)
    .use(rehypeHighlight, {
      detect: true,
      // `languages` replaces the default set, so spread `common` to keep
      // json/yaml/bash/javascript/typescript and add Terraform + nginx.
      languages: { ...common, hcl, terraform: hcl, tf: hcl, nginx },
    })
    .use(rehypeStringify)
    .process(content);

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
