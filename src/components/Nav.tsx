"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { nav, site, socials } from "@/data/content";
import { ArrowUpRight, Close, iconMap } from "./Icons";

export default function Nav({
  onFlame = false,
  counts = {},
}: {
  /** true = sits on the orange home screen, false = on a light page */
  onFlame?: boolean;
  /** Two-digit counters beside nav labels, e.g. { "/projects": "06" } */
  counts?: Record<string, string>;
}) {
  const pathname = usePathname();
  const menu = useRef<HTMLDetailsElement>(null);

  const close = () => {
    if (menu.current) menu.current.open = false;
  };

  /* Navigating closes the menu. Toggling the DOM property rather than
     React state keeps the element the single source of truth. */
  useEffect(close, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const text = onFlame ? "text-white" : "text-ink";

  const isCurrent = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[120] focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-paper"
      >
        Skip to content
      </a>

      <header className={`absolute inset-x-0 top-0 z-50 ${text}`}>
        <div className="rails flex h-20 items-center justify-between gap-6 md:h-24">
          <Link
            href="/"
            className="font-display text-xl leading-none font-bold tracking-tight sm:text-[1.6rem]"
          >
            {site.wordmark}
            <sup className="ml-0.5 align-super text-[0.5em] font-semibold">®</sup>
          </Link>

          {/* Desktop links */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 md:flex lg:gap-8 xl:gap-12"
          >
            {nav.map((item) => {
              const active = isCurrent(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className="rule-link text-[15px] font-medium whitespace-nowrap transition-opacity hover:opacity-100"
                  style={{
                    ["--rule" as string]: active ? 1 : 0,
                    opacity: active ? 1 : 0.82,
                  }}
                >
                  {item.label}
                  {counts[item.href] ? (
                    <span className="ml-1.5 align-super text-[0.68em] opacity-70">
                      ({counts[item.href]})
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>

          {/*
            The menu is a <details> rather than a JS-driven overlay: under
            768px it is the only way to navigate, so it has to keep working
            even if the page never hydrates. <summary> is natively
            keyboard-accessible and needs no script.
          */}
          <details ref={menu} data-nav className="group/menu shrink-0">
            <summary
              aria-label="Menu"
              className="relative z-[120] flex h-10 w-11 cursor-pointer list-none flex-col items-end justify-center gap-[7px] [&::-webkit-details-marker]:hidden"
            >
              <span className="h-[2.5px] w-11 bg-current transition-all duration-300 group-open/menu:hidden" />
              <span className="h-[2.5px] w-11 bg-current transition-all duration-300 group-open/menu:hidden" />
              <Close className="hidden size-7 group-open/menu:block" />
            </summary>

            <div className="fixed inset-0 z-[110]">
              {/* Scrim — a convenience once hydrated; the summary above
                  still closes the menu without any script */}
              <div
                aria-hidden
                onClick={close}
                className="absolute inset-0 bg-coal-950/70 backdrop-blur-sm"
              />

              <div className="absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto overscroll-contain bg-coal-950 text-white sm:w-[min(32rem,90vw)] sm:border-l sm:border-coal-700">
                {/* No close button here: the <summary> sits above this
                    panel and already shows an X when open, so it closes
                    the menu with or without script. */}
                <div className="rails flex h-20 shrink-0 items-center md:h-24">
                  <span className="label text-ash-500">Menu</span>
                </div>

                <nav
                  aria-label="Menu"
                  className="rails flex flex-1 flex-col justify-center gap-1 py-6"
                >
                  {nav.map((item, i) => {
                    const active = isCurrent(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        className="group flex items-baseline justify-between border-b border-coal-800 py-4"
                      >
                        <span className="flex items-baseline gap-4">
                          <span className="label text-ash-500">0{i + 1}</span>
                          <span
                            className={`font-display text-3xl font-bold tracking-tight transition-colors sm:text-4xl ${
                              active
                                ? "text-flame-400"
                                : "text-white group-hover:text-flame-400"
                            }`}
                          >
                            {item.label}
                          </span>
                          {counts[item.href] ? (
                            <span className="label text-ash-500">
                              ({counts[item.href]})
                            </span>
                          ) : null}
                        </span>
                        <ArrowUpRight className="size-5 shrink-0 text-ash-500 transition-all group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-flame-400" />
                      </Link>
                    );
                  })}
                </nav>

                <div className="rails flex shrink-0 flex-wrap items-center justify-between gap-4 pb-8">
                  <ul className="flex items-center gap-2">
                    {socials.map((s) => {
                      const Icon = iconMap[s.icon];
                      return (
                        <li key={s.label}>
                          <a
                            href={s.href}
                            target={s.icon === "mail" ? undefined : "_blank"}
                            rel="noreferrer noopener"
                            aria-label={s.label}
                            className="grid size-11 place-items-center border border-coal-700 text-ash-300 transition-colors hover:border-flame-500 hover:text-flame-400"
                          >
                            <Icon className="size-4.5" />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                  <a
                    href={`mailto:${site.email}`}
                    className="label text-ash-400 transition-colors hover:text-white"
                  >
                    {site.email}
                  </a>
                </div>
              </div>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}
