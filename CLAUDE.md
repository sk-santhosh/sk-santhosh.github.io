# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal resume/CV as a Next.js static site deployed to GitHub Pages on the custom domain `https://sk-santhosh.info` (served at the root).

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
- `public/CNAME` holds the custom domain so GitHub Pages reapplies it on every deploy.
- Static export goes to `out/` — GitHub Actions uploads that directory as the Pages artifact.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`, which runs `npm run build` and deploys `out/` to GitHub Pages on `https://sk-santhosh.info`. Enable Pages in repo Settings → Pages → Source: GitHub Actions, and set the custom domain there (it should match `public/CNAME`).
