import Link from "next/link";
import FitWidth from "./FitWidth";
import { ArrowUpRight, iconMap } from "./Icons";
import { nav, site, socials } from "@/data/content";

const navLabels: Record<string, string> = {
  "/": "Home",
  "/about": "About Me",
  "/projects": "Projects",
  "/blogs": "Blogs",
  "/contact": "Contact Us",
};

export default function Footer() {
  return (
    <footer className="relative z-10 bg-paper-deep text-ink">
      <div className="rails pt-16 pb-8 sm:pt-20 sm:pb-10">
        <div className="grid gap-14 lg:grid-cols-[auto_1fr] lg:items-end lg:gap-16">
          {/* Email + the two navigation columns */}
          <div>
            <a
              href={`mailto:${site.email}`}
              className="inline-block text-[15px] underline decoration-ink/40 underline-offset-[6px] transition-colors hover:text-flame-600 hover:decoration-flame-500 sm:text-base"
            >
              {site.email}
            </a>

            <div className="mt-12 grid grid-cols-2 gap-10 sm:mt-14 sm:gap-20">
              <nav aria-label="Footer">
                <h2 className="label text-ink-mute">Navigation</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {nav.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="rule-link text-[15px] text-ink transition-colors hover:text-flame-600"
                      >
                        {navLabels[item.href] ?? item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <nav aria-label="Elsewhere">
                <h2 className="label text-ink-mute">Navigation</h2>
                <ul className="mt-5 flex flex-col gap-3">
                  {socials.map((s) => {
                    const Icon = iconMap[s.icon];
                    return (
                      <li key={s.label}>
                        <a
                          href={s.href}
                          target={s.icon === "mail" ? undefined : "_blank"}
                          rel="noreferrer noopener"
                          className="group inline-flex items-start gap-1.5 text-[15px] text-ink transition-colors hover:text-flame-600"
                        >
                          <Icon className="mt-[0.3em] size-3.5 shrink-0 text-ink-mute transition-colors group-hover:text-flame-600" />
                          <span className="rule-link">{s.label}</span>
                          <ArrowUpRight className="mt-[0.2em] size-3 shrink-0 text-flame-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            </div>
          </div>

          {/* Oversized wordmark, set to the right of the links */}
          <div className="min-w-0">
            <FitWidth
              text={site.fullName}
              suffix="®"
              fallbackVw={16}
              maxVw={17}
              className="text-ink"
            />
          </div>
        </div>

        <p className="label mt-12 border-t border-rule pt-6 text-ink-mute">
          ©{site.year} {site.legalName} · {site.domain}
        </p>
      </div>
    </footer>
  );
}
