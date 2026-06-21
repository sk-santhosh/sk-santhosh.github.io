// Generates a unique 1200x630 Open Graph card (PNG) for each blog post.
//
// We emit real .png files (not a Next opengraph-image route) because GitHub
// Pages serves extensionless metadata routes as application/octet-stream, which
// strict social scrapers reject. Output: public/og/<slug>.png
//
// Run with:  npm run og   (re-run whenever you add or rename a blog post)

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import sharp from "sharp";

const ROOT = process.cwd();
const BLOGS_DIR = path.join(ROOT, "content/blogs");
const OUT_DIR = path.join(ROOT, "public/og");

const W = 1200;
const H = 630;

const esc = (s) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// Greedy word-wrap by approximate character budget per line.
function wrap(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars) {
      if (cur) lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

function svgFor({ title, date, tags }) {
  const lines = wrap(title, 26).slice(0, 4);
  const fontSize = 58;
  const lineHeight = 74;
  const titleTop = 250;

  const titleTspans = lines
    .map(
      (line, i) =>
        `<tspan x="80" y="${titleTop + i * lineHeight}">${esc(line)}</tspan>`
    )
    .join("");

  const prettyDate = new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "long",
    day: "2-digit",
  });

  const tagLine = (tags ?? []).slice(0, 4).join("  ·  ");

  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${W}" height="${H}" fill="#0f172a"/>
  <rect width="${W}" height="10" fill="#38bdf8"/>
  <text x="80" y="118" font-family="ui-monospace, 'JetBrains Mono', 'SFMono-Regular', Menlo, monospace" font-size="32" font-weight="700" fill="#38bdf8">&gt;_ Santhosh Kumar J</text>
  <text x="80" y="158" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="#94a3b8">Platform Architect · Cloud Architect · SRE</text>
  <text font-family="Inter, Helvetica, Arial, sans-serif" font-size="${fontSize}" font-weight="700" fill="#f8fafc">${titleTspans}</text>
  <text x="80" y="560" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" fill="#64748b">${esc(prettyDate)}</text>
  <text x="80" y="600" font-family="Inter, Helvetica, Arial, sans-serif" font-size="24" font-weight="600" fill="#38bdf8">${esc(tagLine)}</text>
  <text x="1120" y="600" text-anchor="end" font-family="ui-monospace, 'JetBrains Mono', monospace" font-size="24" fill="#475569">sk-santhosh.info</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const files = fs.readdirSync(BLOGS_DIR).filter((f) => f.endsWith(".md"));
  const slugs = new Set(files.map((f) => f.replace(/\.md$/, "")));

  for (const file of files) {
    const slug = file.replace(/\.md$/, "");
    const { data } = matter(fs.readFileSync(path.join(BLOGS_DIR, file), "utf8"));
    const svg = svgFor({
      title: data.title,
      date: data.date,
      tags: data.tags,
    });
    const out = path.join(OUT_DIR, `${slug}.png`);
    await sharp(Buffer.from(svg)).png().toFile(out);
    console.log(`✓ ${path.relative(ROOT, out)}`);
  }

  // Prune cards whose blog post no longer exists.
  for (const f of fs.readdirSync(OUT_DIR).filter((f) => f.endsWith(".png"))) {
    if (!slugs.has(f.replace(/\.png$/, ""))) {
      fs.unlinkSync(path.join(OUT_DIR, f));
      console.log(`✗ removed orphan ${path.join("public/og", f)}`);
    }
  }

  console.log(`\nGenerated ${files.length} OG cards in public/og/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
