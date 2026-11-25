"use client";

import { useState } from "react";
import {
  certifications,
  experience,
  referral,
  site,
  skillGroups,
  socials,
} from "@/data/content";
import { Check } from "./Icons";
import Reveal from "./Reveal";

const linkedin = socials.find((s) => s.icon === "linkedin")!.href;
const github = socials.find((s) => s.icon === "github")!.href;
const latest = experience[0];

/* Grouped the way most referral portals lay out their form */
const groups: {
  title: string;
  fields: { label: string; value: string; wide?: boolean }[];
}[] = [
  {
    title: "Candidate",
    fields: [
      { label: "Full name", value: site.legalName },
      { label: "First name", value: referral.firstName },
      { label: "Last name", value: referral.lastName },
      { label: "Email", value: site.email },
      { label: "Phone", value: site.phone },
      { label: "Location", value: site.location },
    ],
  },
  {
    title: "Links",
    fields: [
      { label: "LinkedIn", value: linkedin },
      { label: "GitHub", value: github },
      { label: "Portfolio", value: site.url },
    ],
  },
  {
    title: "Profile",
    fields: [
      { label: "Most recent role", value: latest.role },
      { label: "Most recent company", value: latest.org },
      { label: "Total experience", value: referral.totalExperience },
      { label: "Notice period", value: referral.noticePeriod },
      { label: "Work authorization", wide: true, value: referral.workAuthorization },
      { label: "Relocation / work mode", wide: true, value: referral.relocation },
      { label: "Target roles", wide: true, value: referral.targetRoles.join(", ") },
    ],
  },
  {
    title: "Skills & certifications",
    fields: [
      {
        label: "Key skills",
        wide: true,
        value: skillGroups.flatMap((g) => g.items).join(", "),
      },
      {
        label: "Certifications",
        wide: true,
        value: certifications
          .map((c) => `${c.name} — ${c.issuer}, ${c.year}`)
          .join("; "),
      },
    ],
  },
];

export default function Refer() {
  return (
    <div className="rails flex flex-col gap-12 pt-12 pb-20 sm:pt-16 sm:pb-24 lg:gap-16 lg:pt-20 lg:pb-28">
      {groups.map((group, i) => (
        <Reveal key={group.title} delay={i * 60}>
          <Section title={group.title}>
            {/* Dividers are borders, not a gap-px fill, so the odd empty cell
                at the end of the last row stays blank instead of showing through */}
            <dl className="grid border-t border-l border-rule sm:grid-cols-2">
              {group.fields.map((f) => (
                <div
                  key={f.label}
                  className={`flex items-start justify-between gap-4 border-r border-b border-rule bg-paper-card px-5 py-4 ${
                    f.wide ? "sm:col-span-2" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <dt className="label text-ink-mute">{f.label}</dt>
                    <dd className="mt-1.5 text-[14.5px] break-words text-ink">
                      {f.value}
                    </dd>
                  </div>
                  <CopyButton value={f.value} label={f.label} />
                </div>
              ))}
            </dl>
          </Section>
        </Reveal>
      ))}

      <Reveal>
        <Section title="Referral note">
          <div className="flex items-start justify-between gap-4 border border-rule bg-paper-card p-6">
            <p className="text-[15px] leading-relaxed text-ink-soft">
              {referral.note}
            </p>
            <CopyButton value={referral.note} label="Referral note" />
          </div>
        </Section>
      </Reveal>
    </div>
  );
}

/* Heading above the fields on small screens; on desktop it takes the left
   third of the page so the fields line up with the grid overlay's columns */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_2fr] lg:gap-0">
      <h2 className="label flex items-center gap-3 self-start text-flame-600 lg:pt-4">
        <span className="h-px w-8 bg-flame-500" />
        {title}
      </h2>
      {children}
    </section>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`Copy ${label}`}
      className="label inline-flex shrink-0 items-center gap-1.5 border border-rule px-2.5 py-1.5 text-ink-soft transition-colors hover:border-flame-700 hover:bg-flame-700 hover:text-white"
    >
      {copied ? (
        <>
          <Check className="size-3.5" />
          Copied
        </>
      ) : (
        "Copy"
      )}
    </button>
  );
}
