import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/content";
import { ArrowUpRight, Asterisk } from "./Icons";

/** The black "Let's Talk" contact card pinned to the bottom-right. */
export default function TalkCard({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/contact"
      className={`group flex items-stretch gap-3 bg-coal-950 p-2.5 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 sm:gap-4 sm:p-3 ${className}`}
    >
      <span className="relative aspect-square w-14 shrink-0 overflow-hidden bg-flame-500 sm:w-[4.5rem]">
        <Image
          src={site.photoFramed}
          alt=""
          fill
          sizes="72px"
          className="object-cover object-top"
        />
      </span>

      <span className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <span className="flex items-start justify-between gap-2">
          <span className="text-[12.5px] text-ash-300">Let&apos;s Talk</span>
          <Asterisk className="size-3.5 shrink-0 text-white transition-transform duration-700 group-hover:rotate-180" />
        </span>
        <span className="mt-2">
          <span className="block truncate text-[15px] leading-tight font-semibold">
            {site.fullName}
          </span>
          <span className="block truncate text-[12px] text-ash-400">
            {site.shortRole}
          </span>
        </span>
      </span>

      <span className="grid size-10 shrink-0 self-end place-items-center bg-white text-coal-950 transition-colors group-hover:bg-flame-500 group-hover:text-white sm:size-11">
        <ArrowUpRight className="size-4.5" strokeWidth={2} />
      </span>
    </Link>
  );
}
