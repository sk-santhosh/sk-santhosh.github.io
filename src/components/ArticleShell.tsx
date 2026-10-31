import Link from "next/link";
import type { ReactNode } from "react";
import Footer from "./Footer";
import GridOverlay from "./GridOverlay";
import { ArrowRight } from "./Icons";
import Nav from "./Nav";
import { getNavCounts } from "@/lib/content";

type Props = {
  backHref: string;
  backLabel: string;
  eyebrow: string;
  title: string;
  lede: string;
  /** Rendered markdown. Authored in /content, so trusted. */
  html: string;
  aside?: ReactNode;
  footer?: ReactNode;
};

/** Reading layout for a single project or post. */
export default function ArticleShell({
  backHref,
  backLabel,
  eyebrow,
  title,
  lede,
  html,
  aside,
  footer,
}: Props) {
  return (
    <div className="page-light relative flex min-h-svh flex-col">
      <GridOverlay on="paper" />
      <Nav counts={getNavCounts()} />

      <main id="main" className="relative z-10 flex-1">
        <header className="rails pt-28 pb-10 sm:pt-36 lg:pt-44">
          <Link
            href={backHref}
            className="group inline-flex items-center gap-2 text-[13px] text-ink-mute transition-colors hover:text-flame-600"
          >
            <ArrowRight className="size-4 rotate-180 transition-transform group-hover:-translate-x-0.5" />
            {backLabel}
          </Link>

          <p className="label mt-10 text-flame-600">{eyebrow}</p>

          <h1 className="mt-4 max-w-4xl font-display text-[clamp(2.1rem,6vw,4.25rem)] leading-[1.02] font-bold tracking-[-0.03em] text-balance text-ink">
            {title}
          </h1>

          <p className="mt-6 max-w-2xl text-[16px] leading-relaxed text-ink-soft sm:text-[18px]">
            {lede}
          </p>
        </header>

        <div className="rails grid gap-12 pb-20 sm:pb-24 lg:grid-cols-[1fr_17rem] lg:gap-16 lg:pb-28">
          <div className="min-w-0 max-w-[46rem]">
            <article
              className="prose-md border-t border-rule pt-10"
              /* Content comes from this repo's own markdown, not user input */
              dangerouslySetInnerHTML={{ __html: html }}
            />

            {/* Outside the article: prose rules would restyle this link */}
            {footer ? <div className="mt-14">{footer}</div> : null}
          </div>

          {aside ? (
            <aside className="flex flex-col gap-8 border-t border-rule pt-10 lg:sticky lg:top-28 lg:self-start">
              {aside}
            </aside>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
