"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/content";
import { ArrowUpRight, Github } from "./Icons";
import Reveal from "./Reveal";

const ALL = "All";

export default function Projects({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState(ALL);

  /* Filters come from the markdown, so a chip can never point at nothing. */
  const filters = useMemo(
    () => [ALL, ...Array.from(new Set(projects.map((p) => p.category))).sort()],
    [projects],
  );

  const visible = useMemo(
    () => (filter === ALL ? projects : projects.filter((p) => p.category === filter)),
    [filter, projects],
  );

  return (
    <div className="rails pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      {/* Filters */}
      <Reveal>
        <div
          role="tablist"
          aria-label="Filter projects by technology"
          className="flex flex-wrap items-center gap-2 border-b border-rule pb-6"
        >
          <span className="label mr-3 text-ink-mute">Filter</span>
          {filters.map((f) => {
            const active = filter === f;
            return (
              <button
                key={f}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setFilter(f)}
                className={`border px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
                  active
                    ? "border-flame-700 bg-flame-700 text-white"
                    : "border-rule text-ink-mute hover:border-flame-500 hover:text-ink"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* List */}
      <ul className="mt-2">
        {visible.map((p, i) => (
          <Reveal as="li" key={p.slug} delay={i * 60}>
            <article className="group relative grid gap-6 border-b border-rule py-9 sm:px-2 lg:grid-cols-[auto_1.25fr_1fr_auto] lg:items-start lg:gap-10">
              <span className="label relative text-ink-mute lg:pt-2">
                <span
                  aria-hidden
                  className="absolute top-1/2 -left-3 h-5 w-0.5 -translate-y-1/2 scale-y-0 bg-flame-500 transition-transform duration-300 group-hover:scale-y-100 lg:top-2.5 lg:-left-4 lg:translate-y-0"
                />
                {String(i + 1).padStart(2, "0")}
              </span>

              <div>
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h2 className="font-display text-2xl leading-tight font-bold tracking-[-0.02em] transition-colors group-hover:text-flame-600 sm:text-[1.75rem]">
                    <Link href={`/projects/${p.slug}`} className="after:absolute after:inset-0">
                      {p.title}
                    </Link>
                  </h2>
                  {p.featured && (
                    <span className="label border border-flame-500 px-2 py-0.5 text-flame-600">
                      Featured
                    </span>
                  )}
                </div>
                <p className="mt-2 text-[13px] text-ink-mute">{p.year}</p>
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <li
                      key={t}
                      className="border border-rule px-2 py-1 text-[11px] text-ink-mute"
                    >
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <p className="text-[14.5px] leading-relaxed text-ink-soft">
                  {p.summary}
                </p>

                <dl className="mt-5 flex flex-wrap gap-x-10 gap-y-4">
                  {p.impact.map((m) => (
                    <div key={m.label}>
                      <dd className="font-display text-xl font-bold text-flame-600">
                        {m.value}
                      </dd>
                      <dt className="label mt-1 text-ink-mute">{m.label}</dt>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="relative z-10 flex items-center gap-4 lg:flex-col lg:items-end lg:gap-3 lg:pt-2">
                {p.repo && (
                  <a
                    href={p.repo}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft transition-colors hover:text-flame-600"
                  >
                    <Github className="size-4" />
                    Source
                  </a>
                )}
                {p.demo && (
                  <a
                    href={p.demo}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-soft transition-colors hover:text-flame-600"
                  >
                    Live
                    <ArrowUpRight className="size-3.5" />
                  </a>
                )}
              </div>
            </article>
          </Reveal>
        ))}
      </ul>

      {visible.length === 0 && (
        <p className="mt-12 border border-dashed border-rule p-12 text-center text-sm text-ink-mute">
          Nothing tagged <span className="text-ink">{filter}</span> yet.
        </p>
      )}
    </div>
  );
}
