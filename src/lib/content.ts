import "server-only";

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";
import { createHighlighterCoreSync } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import darkPlus from "shiki/themes/dark-plus.mjs";
import go from "shiki/langs/go.mjs";
import yaml from "shiki/langs/yaml.mjs";
import typescript from "shiki/langs/typescript.mjs";
import bash from "shiki/langs/bash.mjs";
import toml from "shiki/langs/toml.mjs";
import json from "shiki/langs/json.mjs";
import docker from "shiki/langs/docker.mjs";
import sql from "shiki/langs/sql.mjs";
import hcl from "shiki/langs/hcl.mjs";
import makefile from "shiki/langs/makefile.mjs";

/**
 * Projects and posts are authored as markdown under /content.
 * Everything here runs at build time — the whole site prerenders static.
 */

const ROOT = path.join(process.cwd(), "content");

/* Syntax highlighting runs at build time with Shiki using VS Code's own
   Dark+ theme and TextMate grammars, so code reads exactly as it does in
   the editor and no highlighter ships to the browser. The sync core is
   used so the content loader can stay synchronous. */
const highlighter = createHighlighterCoreSync({
  engine: createJavaScriptRegexEngine(),
  themes: [darkPlus],
  langs: [go, yaml, typescript, bash, toml, json, docker, sql, hcl, makefile],
});

const LANGS = new Set(highlighter.getLoadedLanguages());

/* html: true so project pages can embed their own inline SVG diagrams.
   The markdown is authored in this repo, never user input. */
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(code, lang) {
    const alias: Record<string, string> = {
      ts: "typescript",
      tsx: "typescript",
      sh: "bash",
      shell: "bash",
      dockerfile: "docker",
      yml: "yaml",
      tf: "hcl",
      terraform: "hcl",
      make: "makefile",
    };
    const resolved = alias[lang] ?? lang;
    if (!resolved || !LANGS.has(resolved)) return ""; // fall back to plain
    return highlighter.codeToHtml(code, { lang: resolved, theme: "dark-plus" });
  },
});

export type Impact = { value: string; label: string };

export type Project = {
  slug: string;
  title: string;
  blurb: string;
  summary: string;
  year: string;
  order: number;
  featured: boolean;
  codename?: string;
  category: string;
  tags: string[];
  impact: Impact[];
  repo?: string;
  demo?: string;
  html: string;
};

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  category: string;
  tags: string[];
  featured: boolean;
  html: string;
};

function readDir(dir: string) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) return [];
  return fs
    .readdirSync(full)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(full, file), "utf8");
      const { data, content } = matter(raw);
      return { slug, data, body: content, html: md.render(content) };
    });
}

/** Frontmatter dates parse to Date objects; normalise to YYYY-MM-DD. */
function toISODate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value ?? "");
}

/* Posts carry no reading time in frontmatter, so it is estimated from the
   prose: fenced code and image syntax are stripped first so the number
   tracks what is actually read rather than code density. */
const WORDS_PER_MINUTE = 220;

function readingTime(markdown: string): string {
  const words = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#*_>`~\[\]()]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
  return `${Math.max(1, Math.round(words / WORDS_PER_MINUTE))} min read`;
}

export function getProjects(): Project[] {
  return readDir("projects")
    .map(({ slug, data, html }) => ({
      slug,
      title: String(data.title ?? slug),
      blurb: String(data.blurb ?? ""),
      summary: String(data.summary ?? data.blurb ?? ""),
      year: String(data.year ?? ""),
      order: Number(data.order ?? 99),
      featured: Boolean(data.featured),
      codename: data.codename ? String(data.codename) : undefined,
      category: String(data.category ?? "Project"),
      tags: (data.tags ?? []) as string[],
      impact: (data.impact ?? []) as Impact[],
      repo: data.repo ? String(data.repo) : undefined,
      demo: data.demo ? String(data.demo) : undefined,
      html,
    }))
    .sort((a, b) => a.order - b.order);
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}

/* A same-day multi-part series would otherwise fall back to directory
   order, which reads 3/3 first. The part number in the title breaks the
   tie so the series stays in reading order. */
function seriesPart(title: string): number {
  return Number(title.match(/\((\d+)\/\d+\)\s*$/)?.[1] ?? 0);
}

export function getPosts(): Post[] {
  return readDir("blogs")
    .map(({ slug, data, body, html }) => {
      const tags = (data.tags ?? []) as string[];
      return {
        slug,
        title: String(data.title ?? slug),
        /* `description` is the authored field; `excerpt` stays supported. */
        excerpt: String(data.excerpt ?? data.description ?? ""),
        date: toISODate(data.date),
        readingTime: String(data.readingTime ?? readingTime(body)),
        /* The first tag is the post's subject, so it doubles as the kicker. */
        category: String(data.category ?? tags[0] ?? "Notes"),
        tags,
        featured: Boolean(data.featured),
        html,
      };
    })
    /* Newest first; dates are YYYY-MM-DD, so comparing them as strings is
       chronological. */
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || seriesPart(a.title) - seriesPart(b.title),
    );
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((p) => p.slug === slug);
}

/** Two-digit counters shown beside the nav labels. */
export function getNavCounts(): Record<string, string> {
  const counts: Record<string, string> = {};
  const two = (n: number) => String(n).padStart(2, "0");

  const projects = getProjects().length;
  const posts = getPosts().length;
  if (projects) counts["/projects"] = two(projects);
  if (posts) counts["/blogs"] = two(posts);

  return counts;
}
