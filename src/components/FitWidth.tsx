"use client";

import { useEffect, useRef } from "react";

type Props = {
  text: string;
  className?: string;
  /** Pre-hydration size, in vw. Keep it close so there is no visible jump. */
  fallbackVw: number;
  /**
   * Upper bound on the font size, in vw. Without it a short word like
   * "Blog" stretched across the rails would tower over the page; capped,
   * it simply starts at the left rail and stops short of the right one.
   */
  maxVw?: number;
  /**
   * Optional mark set immediately after the text (e.g. ®). It is measured
   * with the text, so the whole lockup fits the rails and the mark stays
   * glued to the word even when `maxVw` caps the size.
   */
  suffix?: string;
  as?: "span" | "h1";
};

/**
 * Scales a single line of display type so it spans its container
 * exactly — which is how the reference design seats its headings
 * between two grid rails, whatever the name's length.
 *
 * Renders at `fallbackVw` on the server, then measures the real glyph
 * width once the display font has loaded and corrects the size.
 */
export default function FitWidth({
  text,
  className = "",
  fallbackVw,
  maxVw,
  suffix,
  as: Tag = "span",
}: Props) {
  const box = useRef<HTMLDivElement>(null);
  const line = useRef<HTMLElement>(null);

  useEffect(() => {
    const fit = () => {
      const b = box.current;
      const l = line.current;
      if (!b || !l) return;

      // The line is inline-block, so it shrink-wraps the glyphs and
      // getBoundingClientRect gives the true text width — a block
      // element would just report the container's width back.
      const PROBE = 200;
      l.style.fontSize = `${PROBE}px`;
      const natural = l.getBoundingClientRect().width;
      const avail = b.clientWidth;
      if (!natural || !avail) return;

      let size = (avail / natural) * PROBE;
      if (maxVw) size = Math.min(size, (maxVw / 100) * window.innerWidth);
      l.style.fontSize = `${size}px`;
    };

    fit();

    const ro = new ResizeObserver(fit);
    if (box.current) ro.observe(box.current);

    /* The first measurement can land on the fallback face before the
       display webfont swaps in, which would size the line to the wrong
       metrics and leave it there — the container never resizes, so the
       observer would not fire again. Re-fit on every font-load signal. */
    const fonts = document.fonts;
    fonts?.ready.then(fit).catch(() => {});
    fonts?.addEventListener("loadingdone", fit);

    const timers = [
      window.setTimeout(fit, 250),
      window.setTimeout(fit, 1000),
    ];

    return () => {
      ro.disconnect();
      fonts?.removeEventListener("loadingdone", fit);
      timers.forEach(window.clearTimeout);
    };
  }, [text, suffix, maxVw]);

  return (
    <div ref={box} className="w-full overflow-hidden">
      <Tag
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={line as any}
        style={{ fontSize: `${maxVw ? Math.min(fallbackVw, maxVw) : fallbackVw}vw` }}
        className={`inline-block font-display leading-[0.78] font-bold tracking-[-0.035em] whitespace-nowrap ${className}`}
      >
        {text}
        {suffix ? (
          <sup className="ml-[0.05em] align-super text-[0.22em] font-bold">
            {suffix}
          </sup>
        ) : null}
      </Tag>
    </div>
  );
}
