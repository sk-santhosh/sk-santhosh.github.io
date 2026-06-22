# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal resume/CV as a Next.js static site deployed to Vercel on the custom domain `https://sk-santhosh.info` (served at the root).

## Commands

```bash
npm run dev       # local dev server at localhost:3000
npm run build     # static export → out/
npm run lint      # ESLint
```

## Architecture

- **Next.js App Router** with `output: "export"` — all pages render to static HTML at build time. No API routes or server components that use Node.js runtime APIs.
- `basePath` is configurable via the `NEXT_PUBLIC_BASE_PATH` env var but is empty for the current custom-domain (root) deployment. All internal links and image `src` paths still use Next.js `<Link>` / `<Image>` components so a basePath could be reintroduced without code changes.
- The absolute site origin for metadata (Open Graph / canonical) is `NEXT_PUBLIC_SITE_URL`, defaulting to `https://sk-santhosh.info`.
- Static export goes to `out/` — Vercel auto-detects Next.js with `output: "export"` and serves that directory.

## Deployment

Hosted on Vercel with its Git integration: every push to `main` triggers a build (`npm run build`) and deploy. The custom domain `https://sk-santhosh.info` is configured in the Vercel dashboard (Project → Settings → Domains).

Environment variables are set in Vercel (Project → Settings → Environment Variables), not in the repo:
- `NEXT_PUBLIC_GA_ID` — Google Analytics 4 measurement ID (`G-XXXXXXXXXX`); when unset, GA is not loaded.
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — optional Search Console HTML-tag token (DNS verification is already in place, so usually unneeded).
