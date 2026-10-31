"use client";

import { useState } from "react";
import { site, socials } from "@/data/content";
import {
  ArrowUpRight,
  Asterisk,
  Check,
  Mail,
  MapPin,
  Phone,
  iconMap,
} from "./Icons";
import Reveal from "./Reveal";

type Status = "idle" | "sending" | "sent";

export default function Contact() {
  const [status, setStatus] = useState<Status>("idle");

  /**
   * No backend is wired up yet, so this hands the message to the
   * visitor's mail client. Swap for a POST to an API route or form
   * service when one exists.
   */
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "");
    const email = String(data.get("email") ?? "");
    const subject = String(data.get("subject") ?? "Portfolio enquiry");
    const message = String(data.get("message") ?? "");

    setStatus("sending");

    const href =
      `mailto:${site.email}` +
      `?subject=${encodeURIComponent(`${subject} — from ${name}`)}` +
      `&body=${encodeURIComponent(`${message}\n\n— ${name} (${email})`)}`;
    window.location.href = href;

    window.setTimeout(() => setStatus("sent"), 600);
  }

  return (
    <div className="rails pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      <div className="grid gap-px border border-rule bg-rule lg:grid-cols-[0.85fr_1.15fr]">
        {/* Details */}
        <div className="flex flex-col gap-8 bg-paper-card p-7 sm:p-9">
          <Reveal>
            <span className="label flex items-center gap-3 text-flame-600">
              <Asterisk className="size-4" />
              Let&apos;s talk
            </span>
            <h2 className="mt-5 font-display text-3xl leading-[1.05] font-bold tracking-[-0.02em] sm:text-4xl">
              Got a platform that needs to stay up?
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-ink-mute">
              Whether it&apos;s an SRE role, a Kubernetes migration or a second
              opinion on your reliability roadmap — I read every message.
            </p>
          </Reveal>

          <Reveal delay={100}>
            <dl className="flex flex-col gap-6 border-t border-rule pt-7">
              <div className="flex items-start gap-4">
                <Mail className="mt-0.5 size-5 shrink-0 text-flame-600" />
                <div className="min-w-0">
                  <dt className="label text-ink-mute">Email</dt>
                  <dd className="mt-1.5">
                    <a
                      href={`mailto:${site.email}`}
                      className="rule-link text-[14.5px] break-all text-ink"
                    >
                      {site.email}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Phone className="mt-0.5 size-5 shrink-0 text-flame-600" />
                <div className="min-w-0">
                  <dt className="label text-ink-mute">Phone</dt>
                  <dd className="mt-1.5">
                    <a
                      href={`tel:${site.phone.replace(/\s+/g, "")}`}
                      className="rule-link text-[14.5px] text-ink"
                    >
                      {site.phone}
                    </a>
                  </dd>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="mt-0.5 size-5 shrink-0 text-flame-600" />
                <div>
                  <dt className="label text-ink-mute">Based in</dt>
                  <dd className="mt-1.5 text-[14.5px]">{site.location}</dd>
                </div>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={180}>
            <div className="bg-flame-700 p-5">
              <span className="label text-white/80">Status</span>
              <p className="mt-2 text-[14px] leading-relaxed text-white">
                {site.availability} — usually replying within a day, faster if
                something is on fire.
              </p>
            </div>
          </Reveal>

          <Reveal delay={240} className="mt-auto">
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
                      className="grid size-11 place-items-center border border-rule text-ink-soft transition-colors hover:border-flame-700 hover:bg-flame-700 hover:text-white"
                    >
                      <Icon className="size-4.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </Reveal>
        </div>

        {/* Form */}
        <Reveal delay={120} className="bg-paper-card">
          <form
            onSubmit={onSubmit}
            className="flex h-full flex-col gap-6 p-7 sm:p-9"
          >
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Name" name="name" placeholder="Ada Lovelace" />
              <Field
                label="Email"
                name="email"
                type="email"
                placeholder="you@company.com"
              />
            </div>

            <Field
              label="Subject"
              name="subject"
              required={false}
              placeholder="Kubernetes migration, SRE role, …"
            />

            <div className="flex flex-1 flex-col gap-2.5">
              <label htmlFor="message" className="label text-ink-mute">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                required
                rows={6}
                placeholder="What are you building, and what's hurting?"
                className="min-h-36 flex-1 resize-y border border-rule bg-paper-card px-4 py-3 text-[14.5px] text-ink transition-colors placeholder:text-ink-mute focus:border-flame-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={status === "sending"}
              className="group inline-flex items-center justify-center gap-2.5 bg-flame-700 px-6 py-4 text-[14px] font-semibold text-white transition-colors hover:bg-flame-600 disabled:opacity-70"
            >
              {status === "sent" ? (
                <>
                  <Check className="size-4" />
                  Opened in your mail app
                </>
              ) : (
                <>
                  {status === "sending" ? "Preparing…" : "Send message"}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </>
              )}
            </button>

            <p className="text-center text-[11.5px] text-ink-mute">
              This opens your email client — nothing is stored on this site.
            </p>
          </form>
        </Reveal>
      </div>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={name} className="label text-ink-mute">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="border border-rule bg-paper-card px-4 py-3 text-[14.5px] text-ink transition-colors placeholder:text-ink-mute focus:border-flame-500 focus:outline-none"
      />
    </div>
  );
}
