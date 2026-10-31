import type { ReactNode } from "react";
import FitWidth from "./FitWidth";
import Footer from "./Footer";
import GridOverlay from "./GridOverlay";
import Nav from "./Nav";
import { getNavCounts } from "@/lib/content";
import { site } from "@/data/content";

type Props = {
  index: string;
  title: string;
  lede: string;
  children: ReactNode;
};

/**
 * Shared chrome for the scrolling inner routes: a light page carrying the
 * same fixed grid as the home screen, an oversized masthead, then content
 * and the footer.
 */
export default function PageShell({ index, title, lede, children }: Props) {
  return (
    <div className="page-light relative flex min-h-svh flex-col">
      <GridOverlay on="paper" />
      <Nav counts={getNavCounts()} />

      <main id="main" className="relative z-10 flex-1">
        <header className="rails pt-28 pb-10 sm:pt-36 sm:pb-14 lg:pt-44 lg:pb-16">
          <span className="label block text-ink-mute">
            {index} / {site.name}
          </span>

          <h1 className="sr-only">{title}</h1>

          {/* The title is the page's own oversized wordmark, rail to rail */}
          <div aria-hidden className="mt-5">
            <FitWidth text={title} fallbackVw={20} maxVw={23} className="text-ink" />
          </div>

          <p className="mt-8 max-w-2xl text-[15px] leading-relaxed text-ink-soft sm:text-[17px]">
            {lede}
          </p>
        </header>

        {children}
      </main>

      <Footer />
    </div>
  );
}
