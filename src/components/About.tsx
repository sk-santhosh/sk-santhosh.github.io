import Image from "next/image";
import {
  about,
  certifications,
  experience,
  languages,
  services,
  site,
  skillGroups,
  stats,
} from "@/data/content";
import { Check, iconMap } from "./Icons";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

export default function About() {
  return (
    <div className="rails flex flex-col gap-24 pt-12 pb-20 sm:gap-28 sm:pt-16 sm:pb-24 lg:gap-32 lg:pt-20 lg:pb-28">
      {/* ------------------------------------------------ Bio */}
      <section className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <figure className="relative aspect-4/5 w-full max-w-sm overflow-hidden border border-rule bg-paper-deep">
            <Image
              src={site.photoFramed}
              alt={`${site.fullName}, ${site.role}`}
              fill
              sizes="(max-width: 1024px) 80vw, 24rem"
              className="object-cover object-top"
            />
            {/* Warm the photo into the palette and seat the caption */}
            <div
              aria-hidden
              className="absolute inset-0 bg-flame-600/18 mix-blend-color"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ink/85 via-ink/35 to-transparent"
            />
            <span aria-hidden className="absolute bottom-0 left-0 h-1 w-14 bg-flame-500" />
            <figcaption className="label absolute bottom-4 left-4 text-white">
              {site.location}
            </figcaption>
          </figure>
        </Reveal>

        <div className="flex flex-col gap-8">
          <SectionHeading eyebrow="About" title={about.heading} />

          <div className="flex flex-col gap-5">
            {about.paragraphs.map((p, i) => (
              <Reveal key={i} delay={i * 80}>
                <p className="text-[15px] leading-[1.8] text-ink-soft sm:text-base">
                  {p}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={240}>
            <dl className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-4">
              {stats.map((st) => (
                <div key={st.label} className="bg-paper-card px-4 py-5">
                  <dd className="font-display text-xl font-bold tracking-tight text-flame-600 sm:text-2xl">
                    {st.value}
                  </dd>
                  <dt className="label mt-1.5 text-ink-mute">{st.label}</dt>
                </div>
              ))}
            </dl>
          </Reveal>

          <Reveal delay={300}>
            <div className="border border-rule bg-paper-card p-6">
              <h3 className="label text-flame-600">Certifications</h3>
              <ul className="mt-5 flex flex-col gap-3">
                {certifications.map((c) => (
                  <li
                    key={c.name}
                    className="flex items-start gap-3 text-[14px] text-ink-soft"
                  >
                    <Check className="mt-0.5 size-4 shrink-0 text-flame-600" />
                    <span>
                      {c.name}
                      <span className="mt-0.5 block text-[12.5px] text-ink-mute">
                        {c.issuer} · {c.year}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="label mt-7 border-t border-rule pt-6 text-flame-600">
                Languages
              </h3>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                {languages.map((l) => (
                  <li key={l.name} className="text-[14px] text-ink-soft">
                    {l.name}
                    <span className="ml-2 text-[12.5px] text-ink-mute">
                      {l.level}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ------------------------------------------------ Principles */}
      <section>
        <SectionHeading
          eyebrow="How I work"
          title="Four rules I don't bend"
          description="They are unglamorous, and they are the reason the pager stays quiet."
        />

        <ul className="mt-10 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {about.principles.map((p, i) => {
            const Icon = iconMap[p.icon];
            return (
              <Reveal as="li" key={p.title} delay={i * 80}>
                <div className="group h-full bg-paper p-6 transition-colors hover:bg-paper-card lg:p-7">
                  <span className="grid size-11 place-items-center border border-rule text-flame-600 transition-colors group-hover:border-flame-700 group-hover:bg-flame-700 group-hover:text-white">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-5 font-display text-[16px] font-bold tracking-tight">
                    {p.title}
                  </h3>
                  <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-mute">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------ Services */}
      <section>
        <SectionHeading
          eyebrow="Services"
          title="What I'm usually brought in to do"
        />

        <ul className="mt-10 border-t border-rule">
          {services.map((s, i) => (
            <Reveal as="li" key={s.title} delay={i * 70}>
              <div className="group grid gap-3 border-b border-rule py-7 transition-colors hover:bg-paper-card sm:grid-cols-[auto_1fr_1.4fr] sm:items-baseline sm:gap-8 sm:px-2">
                <span className="label text-ink-mute">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-display text-xl font-bold tracking-tight transition-colors group-hover:text-flame-600 sm:text-2xl">
                  {s.title}
                </h3>
                <p className="text-[14px] leading-relaxed text-ink-mute">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------ Toolkit */}
      <section>
        <SectionHeading
          eyebrow="Toolkit"
          title="The stack I reach for every day"
          description="Chosen for boring reliability, not novelty — and each one has carried real production traffic."
        />

        {/* Dividers are borders, not a gap-px fill, so the odd empty cell
            at the end of the last row stays blank instead of showing through */}
        <div className="mt-10 grid border-t border-l border-rule sm:grid-cols-2 lg:grid-cols-3">
          {skillGroups.map((group, i) => (
            <Reveal key={group.title} delay={i * 60}>
              <div className="h-full border-r border-b border-rule p-6">
                <h3 className="flex items-center gap-2.5 text-[13px] font-semibold tracking-wide">
                  <span className="h-3.5 w-0.5 bg-flame-500" />
                  {group.title}
                </h3>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((item) => (
                    <li
                      key={item}
                      className="border border-rule px-2.5 py-1.5 text-[11.5px] text-ink-soft transition-colors hover:border-flame-500 hover:text-flame-600"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------ Experience */}
      <section>
        <SectionHeading eyebrow="Experience" title="Where I've been on call" />

        <ol className="relative mt-10 border-l border-rule pl-6 sm:pl-10">
          {experience.map((job, i) => (
            <Reveal
              as="li"
              key={job.role}
              delay={i * 90}
              className="relative pb-12 last:pb-0"
            >
              <span
                aria-hidden
                className="absolute top-2 -left-[1.5625rem] size-2.5 bg-flame-500 sm:-left-[2.5625rem]"
              />
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                  {job.role}
                </h3>
                <span className="label text-flame-600">{job.period}</span>
              </div>
              <p className="mt-1.5 text-[13px] text-ink-mute">
                {job.org} · {job.location}
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {job.points.map((pt) => (
                  <li
                    key={pt}
                    className="relative pl-5 text-[14px] leading-relaxed text-ink-mute before:absolute before:top-[0.65em] before:left-0 before:h-px before:w-3 before:bg-rule"
                  >
                    {pt}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ol>
      </section>
    </div>
  );
}
