# sk-santhosh.info

Portfolio for **Santhosh** — Cloud Native & SRE Engineer.
Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript.

## Run

```bash
npm run dev     # dev server
npm run build   # production build (all routes prerender static)
npm start       # serve the build
npm run lint
```

## Structure

| Path | Purpose |
| --- | --- |
| `src/app/page.tsx` | Home — a single **non-scrolling, full-viewport** screen |
| `src/app/{about,projects,blog,contact}/page.tsx` | The scrolling inner routes |
| `src/components/PageShell.tsx` | Masthead + grid + footer chrome for inner routes |
| `src/components/Nav.tsx` | Header links, counters, fullscreen overlay menu |
| `src/components/GridOverlay.tsx` | Draws the hairline rails and `+` registration marks |
| `src/components/FitWidth.tsx` | Scales display type to span exactly between two rails |
| `src/components/ScreenLock.tsx` | Locks the viewport on `/` only |
| `src/app/projects/[slug]/page.tsx` | Project detail pages, generated from the markdown |
| `content/projects/*.md` | **The five projects** — add a file, it appears |
| `content/blogs/*.md` | Posts (currently empty — see below) |
| `src/lib/content.ts` | Reads and parses that markdown at build time |
| `src/data/content.ts` | The rest of the site copy — bio, skills, experience, socials |
| `src/app/globals.css` | Design tokens, custom utilities, animations |

## Editing content

**Projects and posts are markdown.** Drop a `.md` file into `content/projects/`
or `content/blogs/` and it appears in the listing, gets its own page, and is
added to the sitemap — no code change. The filename is the URL slug.

```yaml
---
title: Unified Observability Mesh
blurb: One-line summary for the listing.
summary: A longer standfirst, shown under the title on the detail page.
year: "2025"
order: 2            # listing order; lowest first
featured: true      # marks it, and picks the home screen's work card
codename: ZERODRIFT # short mark for that card (optional)
category: Observability
tags: [OpenTelemetry, Grafana, Go]
impact:
  - value: "-48%"
    label: observability spend
repo: https://github.com/...
---

Markdown body…
```

Posts take `title`, `excerpt`, `date`, `readingTime`, `category`, `featured`.

Each project page carries **inline SVG diagrams** written straight into the
markdown (`markdown-it` runs with `html: true` — the content is authored in
this repo, never user input). Wrap one in
`<figure class="diagram">…<figcaption>…</figcaption></figure>` and the styles
in `globals.css` handle the frame, sizing and caption. The filter chips on
`/projects` are derived from the `category` field, so a chip can never point
at an empty result.

**Code blocks are highlighted by Shiki** with VS Code's own Dark+ theme and
TextMate grammars, run at build time through the sync core — the rendered
HTML carries the colours, so no highlighter ships to the browser. Languages
are registered in `src/lib/content.ts`; add one there before using a new
fence tag, or it falls back to plain text rather than failing.

Every project's code is quoted from the repo it links to, not written for
the page. Keeping it that way is the point — if a snippet drifts from the
source, the page is lying.

**Pages are explanation-first.** Each one follows the same shape: a short
intro saying what the thing is, *The problem it solves*, *How it works* with
a diagram and a numbered walkthrough whose steps match the numbers drawn in
the diagram, then at most one or two short snippets of the single most
interesting decision, then the trade-off and a link to the repo for
everything else. Roughly 500 words of prose to 20–60 words of code — the code
is evidence for the explanation, not the content.

One gotcha: a frontmatter value containing `": "` must be quoted, or YAML
reads it as a nested mapping and the build fails on that whole file.

Everything else — name, role, statement, bio, skills, experience, services,
socials — is in `src/data/content.ts`, sourced from the CV
(*Kubernetes & SRE Engineer*, Oct 2026). The nav counters beside *Projects*
and *Blogs* are counted from the markdown, so they stay correct on their own.

Note `site.role` is **"Cloud Native & SRE Engineer"**, the title you asked for;
the CV uses *"Kubernetes & SRE Engineer"*. One line in `content.ts` switches it.

## Navigation

Under 768px the slide-out menu is the only way to move between pages, so it is
a native `<details>`/`<summary>` disclosure rather than a JS-driven overlay —
it opens, closes and navigates with **no JavaScript at all**. Script only adds
closing on route change and on Escape. The `<summary>` is layered above the
panel so it can still close the menu when nothing has hydrated.

`allowedDevOrigins` in `next.config.ts` lets the dev server be opened from a
phone on the LAN. Without it Next blocks `/_next/*` cross-origin, the page
renders from SSR but never hydrates, and the menu — the only mobile nav —
silently stops working.

## iOS Safari

Verified on WebKit (Playwright) at iPhone 15, iPhone SE and iPad Mini — no JS
errors, no horizontal overflow, home locked to the viewport, inner pages
scrolling, and the menu working with JavaScript disabled. Specifics that
matter there:

- the home screen is sized in **`svh`**, not `dvh` — Safari's collapsing
  toolbar changes `dvh` mid-session, which can clip a locked full-screen page
- `html.screen-locked` paints the flame colour, so if the toolbar does
  collapse the exposed strip matches instead of flashing the page ground
- form controls are **16px** below the `sm` breakpoint; anything smaller makes
  iOS zoom the viewport when a field takes focus
- `text-size-adjust: 100%` stops Safari inflating text in landscape

## Theme

The home screen is the orange field. Every other page is light — warm paper
(`--color-paper`) with near-black text and orange accents — and the slide-out
menu stays dark on all of them.

## The home screen

Home is locked to the viewport. `<ScreenLock/>` in the root layout toggles a
`screen-locked` class on `<html>` from the current pathname.

It deliberately does *not* key off a `:has()` selector on the page element:
during a client-side navigation the router can keep the previous tree mounted
for a beat, which left the next page unscrollable. Verified non-scrolling at
1440×900, 1280×720, 834×1112, 390×844 and 360×640, with every other route
scrolling normally.
On short landscape viewports (`max-height: 620px`) the featured-work card is
dropped so it cannot collide with the contact card.

## The layout grid

Every line the grid draws and every edge content sits on read the same tokens,
declared once on `:root` in `globals.css`:

```
--rail-1: 5%    --rail-2: 35%    --rail-3: 65%    --rail-4: 95%
--row-1: 13%    --row-2: 72%
```

So text lands *on* the lines rather than inside arbitrary padding:

- the wordmark, statement, `©` line and big name all start on `--rail-1`
- the hamburger, work card and contact card all end on `--rail-4`
- the statement and the work card share a top edge; the name and the contact
  card share a bottom edge
- `FitWidth` measures the real glyph width and scales the type so the watermark
  spans rail-1 → rail-4 exactly, and the big name rail-1 → rail-3 — whatever
  name you put in `content.ts`. Its `maxVw` caps the size so a short title
  ("Blog") starts at the left rail instead of towering over the page.

`GridOverlay` is `position: fixed`, so the rails are in the same place on every
page and content scrolls behind them. The two horizontal rails and the `+`
marks are drawn only on the non-scrolling home screen — fixed horizontals read
as strikethroughs once text scrolls past them.

Use the `rails` utility for padded content, `rail-l` / `rail-rt` for absolutely
positioned content. Phones widen the outer rails to 6.5% / 93.5% so the gutter
stays comfortable.

## The portrait

`public/santhosh-cutout.webp` is a background-removed cut-out (1200×2394, alpha,
~250 KB) derived from the original 4082×6123 PNG: cropped to its alpha bounding
box and re-encoded. Because it has no backdrop it is composited straight onto
the orange field with no blending tricks.

The home screen crops it with `object-cover` against a `66/100` box anchored to
the top, which turns the full-length figure into a head-and-torso shot — adjust
that aspect ratio to change the crop without touching the image.

`public/santhosh.jpg` is the original framed photo, still used for the About
page portrait and the contact card avatar (`site.photoFramed`).

## Contact form

`src/components/Contact.tsx` has no backend: it composes a `mailto:` and hands
off to the visitor's mail client. Swap `onSubmit` for a POST to an API route or
a form service when one exists.

## Deploying to sk-santhosh.info

`site.url` in `src/data/content.ts` already points at the domain and feeds the
canonical URL, Open Graph tags, `sitemap.xml` and `robots.txt`. Point the domain
at the host (Vercel, Netlify, Cloudflare Pages — the build is fully static) and
nothing else needs changing.


## Blogs is currently empty

All the writing lives on the project pages, so `content/blogs/` has no files
and `/blogs` renders an empty state. The `/blogs/[slug]` detail route was
removed with it: under `cacheComponents`, `generateStaticParams` must return
at least one entry, so an empty section cannot have a dynamic child route.

To start publishing, add a markdown file to `content/blogs/` and restore
`src/app/blogs/[slug]/page.tsx` — it is in git history, and is the same shape
as the project detail route. The nav counter appears on its own once there is
something to count.


## Why cacheComponents is off

The Next scaffold enabled `cacheComponents` (and `partialPrefetching`, which
depends on it). Every route here renders from markdown on disk at build time,
so there is no dynamic data for it to help with, and it kept costing
workarounds: it blocks `dynamicParams`, it required an `instant = false`
escape hatch on the project detail route, and it rejects any clock read
during prerender — which Shiki does internally, failing the build outright.

Turned off, every page is plain static (`○`/`●` in the build output, no PPR
fallbacks) and the escape hatches are gone. Turn it back on only if a route
ever needs request-time data.
