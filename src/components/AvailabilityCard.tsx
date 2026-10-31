import Link from "next/link";
import { ArrowUpRight, Asterisk } from "./Icons";
import { site } from "@/data/content";

/**
 * The white card on the home screen's right rail. It carries the
 * availability notice rather than a project link.
 *
 * `compact` is the phone form: the card itself has no room there, so the
 * same notice becomes a slim bar that stacks directly on the talk card.
 * It keeps that card's ground and shadow so the two read as one unit —
 * and so the copy never has to hold contrast against the portrait.
 */
export default function AvailabilityCard({
  className = "",
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <Link
        href="/contact"
        className={`group flex items-center gap-2.5 bg-coal-950 px-3 py-3 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${className}`}
      >
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inset-0 rounded-full bg-flame-400 animate-pulse-dot" />
          <span className="relative size-2 rounded-full bg-flame-400" />
        </span>
        <span className="truncate text-[11.5px] font-semibold tracking-[0.08em] uppercase">
          {site.availability}
        </span>
        <ArrowUpRight className="ml-auto size-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </Link>
    );
  }

  return (
    <Link
      href="/contact"
      className={`group block bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 ${className}`}
    >
      <div className="flex flex-col gap-5 bg-coal-950 p-5 text-white">
        <div className="flex items-start justify-between gap-3">
          <span className="label text-white/60">Status</span>
          <Asterisk className="size-3.5 shrink-0 transition-transform duration-700 group-hover:rotate-180" />
        </div>

        <p className="flex items-start gap-2.5">
          <span className="relative mt-[0.45em] flex size-2 shrink-0">
            <span className="absolute inset-0 rounded-full bg-flame-400 animate-pulse-dot" />
            <span className="relative size-2 rounded-full bg-flame-400" />
          </span>
          <span className="font-display text-[17px] leading-[1.25] font-bold tracking-tight">
            {site.availability}
          </span>
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 px-2 py-2.5">
        <span className="truncate text-[12px] font-medium tracking-[0.04em] text-coal-950 uppercase">
          Get in touch
        </span>
        <ArrowUpRight className="size-3.5 shrink-0 text-coal-950 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </Link>
  );
}
