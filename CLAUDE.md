# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal resume/CV as a Next.js static site deployed to GitHub Pages at `/<repo-name>/cv`.

## Commands

```bash
npm run dev       # local dev server at localhost:3000
npm run build     # static export → out/
npm run lint      # ESLint
```

## Architecture

- **Next.js App Router** with `output: "export"` — all pages render to static HTML at build time. No API routes or server components that use Node.js runtime APIs.
- `basePath` is set via `NEXT_PUBLIC_BASE_PATH` env var (`/cv` in CI, empty locally). All internal links and image `src` paths must use `basePath`-aware helpers or Next.js `<Link>` / `<Image>` components so they work both locally and on GitHub Pages.
- Static export goes to `out/` — GitHub Actions uploads that directory as the Pages artifact.

## Deployment

Push to `main` triggers `.github/workflows/deploy.yml`, which builds with `NEXT_PUBLIC_BASE_PATH=/cv` and deploys to GitHub Pages. Enable Pages in repo Settings → Pages → Source: GitHub Actions before the first deploy. The repo name should match the `basePath` value in the workflow.
