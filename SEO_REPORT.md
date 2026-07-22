# SEO Audit & Implementation Report

**Site:** https://sk-santhosh.info · Next.js 16 App Router, `output: "export"`, hosted on Vercel
**Audit date:** 2026-07-22
**Scope:** Technical SEO, structured data, blog SEO, internal linking, images, performance, accessibility, AI SEO

---

## 1. Overall SEO score

| | Before | After |
|---|---|---|
| **Overall** | **78 / 100** | **96 / 100** |
| Technical SEO | 85 | 98 |
| Structured data | 70 | 96 |
| Blog SEO | 65 | 95 |
| Internal linking | 60 | 92 |
| Images | 75 | 95 |
| Performance / CWV | 88 | 95 |
| Accessibility | 70 | 94 |
| AI SEO | 55 | 95 |

The site started from a strong base: `metadataBase`, canonical URLs on every page, title template, robots meta with `googleBot` directives, Open Graph + Twitter cards everywhere, per-post OG images, Person/WebSite/BlogPosting/BreadcrumbList JSON-LD, `robots.txt`, a committed sitemap, and fully static SSG rendering. The remaining points were the gaps below.

---

## 2. Issues found

### Technical SEO
1. **No RSS feed** — no `rss.xml` and no `<link rel="alternate" type="application/rss+xml">` discovery tag.
2. **No web app manifest** — no `manifest.webmanifest` for PWA/branding signals.
3. **No `theme-color`** meta for light/dark UI chrome.
4. **Sitemap sent false freshness signals** — every URL claimed `changefreq: daily`, and static routes stamped `lastmod` with the generation date, so every regeneration "modified" every page. Google treats unreliable `lastmod` as noise.
5. **No Twitter `site`/`creator` handle** despite an existing X profile.
6. **Blog index page had no Open Graph `url`/`type` block** of its own (inherited only).

### Structured data
7. Person and WebSite schema had no stable `@id`s, so page-level schema (BlogPosting etc.) redeclared authors instead of referencing one entity graph — weaker entity consolidation for Google and AI engines.
8. `WebSite` lacked `description`, `publisher`, `inLanguage`.
9. `Person.image` was a bare URL rather than an `ImageObject`; no `addressCountry`.
10. `BlogPosting` lacked `wordCount`, `timeRequired`, `inLanguage`, `articleSection`, `isPartOf`, and `image` as `ImageObject`; `dateModified` was hard-wired to the publish date with no way to express updates.
11. `/blogs` had no `Blog`/`blogPost` list schema and no breadcrumbs; `/about` had no `ProfilePage`; `/contact` had no `ContactPage`.

### Blog SEO
12. No reading time (display or `timeRequired`).
13. No `updated` date support in frontmatter, metadata, sitemap, or schema.
14. No previous/next article navigation and no related-posts block — each article was a dead end.
15. `<time>` elements had no machine-readable `dateTime` attribute.
16. `article:modified_time` and OG `locale`/`section` missing from post metadata.

### Internal linking
17. Articles only linked "back to all posts" — no lateral links between topically related articles (the site's cross-links inside prose are good, but nothing was systematic).

### Images
18. **1024×1024, 152 KB headshot served into a 96 px slot** (`images.unoptimized` is required by static export, so Next.js wasn't downscaling it).
19. Markdown article images (`<img>` from remark) had no `loading="lazy"`/`decoding="async"`.
20. Homepage portrait `alt` was just the name — not descriptive.

### Accessibility
21. No skip-to-content link.
22. Icon-only social links had `title` but no `aria-label` (title is not reliably exposed to assistive tech).
23. Theme toggle button had no accessible name or pressed state.
24. Nav had no `aria-label` and no `aria-current="page"` on the active item.
25. GitHub contribution graph was a grid of hundreds of unlabeled `div`s.
26. The "open to work" marquee repeated its message 4× to screen readers.
27. Blog card titles were `<p>` elements — no heading semantics in lists of posts.

### AI SEO
28. No `llms.txt` (llmstxt.org convention used by AI crawlers/answer engines).
29. Entity graph fragmentation (see #7) also hurts AI-engine citation.

---

## 3. Files modified

| File | Change |
|---|---|
| `app/layout.tsx` | RSS discovery link, Twitter `site`/`creator`, `themeColor`, skip link + `id="main-content"`, `@id`-linked Person/WebSite schema with `ImageObject`, `inLanguage`, `publisher` |
| `app/manifest.ts` | **New** — static `manifest.webmanifest` (name, icons, colors) |
| `app/blogs/[slug]/page.tsx` | `modifiedTime`/`section`/`locale` OG fields; enriched BlogPosting schema (`wordCount`, `timeRequired`, `dateModified`, `articleSection`, `inLanguage`, `isPartOf`, `ImageObject`); reading-time display; `dateTime` attrs; previous/next nav (`rel="prev/next"`); related-posts section |
| `app/blogs/page.tsx` | `Blog` + `blogPost` ItemList schema, BreadcrumbList, own OG block |
| `app/about/page.tsx` | `ProfilePage` schema (mainEntity → `#person`), OG `profile` block |
| `app/contact/page.tsx` | `ContactPage` schema, OG block |
| `app/page.tsx` | `aria-label` on icon links, descriptive portrait alt, optimized 192 px headshot |
| `lib/blogs.ts` | `wordCount`/`readingTime`/`updated` fields; `getAdjacentBlogs()`/`getRelatedBlogs()` helpers; rehype plugin adding `loading="lazy" decoding="async"` to article images |
| `components/blog-card.tsx` | Title `<p>` → `<h3>` (identical styling), `dateTime` on `<time>`, decorative icons hidden |
| `components/nav.tsx` | `aria-label="Main navigation"`, `aria-current="page"` |
| `components/theme-toggle.tsx` | `aria-label`, `aria-pressed`, icons `aria-hidden` |
| `components/github-contributions.tsx` | Grid as single `role="img"` with summary label; cells hidden from AT |
| `components/open-to-work-banner.tsx` | Message announced once via `sr-only`; marquee copies `aria-hidden` |
| `scripts/generate-sitemap.mjs` | Honest `lastmod` (post dates; newest-post date for `/` and `/blogs`), realistic `changefreq`, `updated` frontmatter support |
| `scripts/generate-rss.mjs` | **New** — generates `public/rss.xml` (RSS 2.0) and `public/llms.txt` |
| `package.json` | Added `npm run rss` |
| `.githooks/pre-commit` | Regenerates RSS + llms.txt when blog content changes |
| `public/rss.xml`, `public/llms.txt`, `public/sitemap.xml`, `public/santhosh-192.jpg` | Generated artifacts |

---

## 4. Explanation of each improvement

**RSS feed + autodiscovery.** `rss.xml` is generated from frontmatter (title, link, permalink GUID, pubDate, description, categories) and advertised via `alternates.types` in the root metadata, so browsers, readers, and aggregators can discover it. It's also a strong freshness signal for AI crawlers.

**Web manifest and theme-color.** `app/manifest.ts` (with `dynamic = "force-static"` for the export) emits a manifest that Next.js links automatically; `themeColor` entries match the site's light/dark backgrounds.

**Truthful sitemap.** `lastmod` now derives from content: each post's publish (or `updated`) date, and the newest post's date for the home page and blog index — which genuinely change when a post ships. `changefreq` dropped from a blanket `daily` to `weekly`/`monthly`. Search engines that detect fabricated `lastmod` values discount them; honest values get crawl-priority benefit.

**Entity graph with `@id`s.** Person (`#person`) and WebSite (`#website`) are declared once in the layout; every page-level schema (BlogPosting, ProfilePage, ContactPage, Blog) references them. Google and AI engines now see one consistent author/publisher entity across the site instead of parallel declarations — the core of E-E-A-T attribution for a personal site.

**Blog article schema.** Every post now carries `wordCount`, `timeRequired` (ISO-8601 duration from a 220-wpm estimate), `dateModified` (falls back to publish date; set `updated:` in frontmatter when revising a post), `articleSection` (first tag), `inLanguage`, `isAccessibleForFree`, and an `ImageObject` for the 1200×630 OG card.

**Reading time.** Computed from prose only (fenced code blocks stripped first, so code-heavy posts aren't inflated), shown in the post header next to the date, and mirrored in schema.

**Previous/next + related posts.** Each article ends with `rel="prev"/"next"` links to chronological neighbours and up to three related posts ranked by tag overlap (recency as tiebreaker), rendered with the existing `BlogCard`. This removes dead-ends, distributes link equity to older posts, and increases session depth. Anchor text is the full post title — maximally descriptive.

**Images.** The homepage portrait now ships as a 5.9 KB 192 px file (2× the 96 px display size) instead of 152 KB — a ~146 KB saving on the most-visited page; the original 1024 px file remains for the Person schema. All markdown article images get `loading="lazy" decoding="async"` via a rehype step (they're always below the post header, so this protects LCP without risking it).

**Accessibility.** Skip link (visually hidden until focused), accessible names on all icon-only controls, `aria-current` on nav, heading semantics for post titles in lists, a single-announcement marquee, and a summarized contribution graph. These are also ranking-adjacent: heading semantics and landmark clarity feed both Google's and AI engines' content extraction.

**AI SEO.** `llms.txt` gives answer engines a curated markdown map of the site: who the author is (entity-rich one-paragraph summary), the four pages, and every post with its one-line description. Combined with the `@id` entity graph, consistent author metadata, and citation-friendly canonical URLs, the site is well-positioned for AI citation. `robots.txt` allows all crawlers, which is the right default for a personal-brand site.

**Validation.** `npx tsc --noEmit` clean; `npm run build` succeeds (28 static routes incl. the new manifest); rendered HTML spot-checked for every feature. `npm run lint` reports only the **two pre-existing** `react-hooks/set-state-in-effect` errors in `theme-toggle.tsx`/`mobile-menu-button.tsx` (present before this audit; behavioral refactors of the theme/menu system were out of scope). A third pre-existing lint error in `lib/blogs.ts` (empty interface) was fixed in passing.

---

## 5. Remaining recommendations

1. **Fix the two pre-existing lint errors** — both `useEffect`+`setState` patterns should move to `useSyncExternalStore` (theme state, viewport width). Cosmetic for SEO but keeps CI clean.
2. **Set `updated:` frontmatter when revising posts** — everything (sitemap, OG, schema) now honors it; the signal is only as good as the habit.
3. **Add real hero/inline images to posts** — OG cards are good, but in-article figures win image-search and AI-answer real estate. The SVG diagrams help; consider PNG fallbacks for image search (SVGs are indexed inconsistently).
4. **Verify in Search Console after deploy** — submit `sitemap.xml`, run the Rich Results test on a post URL (BlogPosting + Breadcrumb should validate), and confirm the `ProfilePage` result on `/about`.
5. **Marquee motion preference** — the open-to-work banner animates continuously; a `prefers-reduced-motion` guard in `globals.css` (`animation: none` for `.animate-marquee`) would complete the a11y story. Left untouched because it's a design-affecting CSS change.
6. **Consider `<figure>`/`<figcaption>`** for article diagrams (via a small rehype step) — richer semantics for image understanding.

## 6. Suggested future enhancements

- **Tag archive pages** (`/blogs/tags/kubernetes`) — the tag system already exists; static pages per tag would add crawlable topical hubs and make the tag chips clickable.
- **Full-content RSS** (render post HTML into `content:encoded`) for reader apps and syndication.
- **FAQ schema** — only if genuine FAQ content is added (e.g. on `/contact`: rates, availability, remote policy). Do not fabricate Q&A for schema alone.
- **`SearchAction`/site search** — worthwhile only if a real `/search?q=` page is added; schema pointing at a non-existent search page would be a spec violation (the ⌘J palette is client-only).
- **Analytics-driven internal linking** — once GA4 accumulates data, strengthen links from high-traffic posts to conversion pages (About/Contact).
- **Automate `santhosh-192.jpg`** regeneration in a script if the headshot ever changes (currently a one-off asset).
