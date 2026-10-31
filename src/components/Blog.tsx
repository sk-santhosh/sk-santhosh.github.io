import Link from "next/link";
import type { Post } from "@/lib/content";
import { ArrowUpRight, Clock } from "./Icons";
import Reveal from "./Reveal";

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function Blog({ posts }: { posts: Post[] }) {
  if (posts.length === 0) {
    return (
      <div className="rails pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
        <Reveal>
          <div className="max-w-2xl border-t border-rule pt-10">
            <p className="text-[16px] leading-relaxed text-ink-soft sm:text-[17px]">
              Nothing published here yet. The write-ups currently live on the
              project pages — each one covers why the thing exists, the code
              that matters, and what I would tell you before adopting it.
            </p>
            <Link
              href="/projects"
              className="group mt-8 inline-flex items-center gap-2 border border-rule px-6 py-4 text-[14px] font-semibold text-ink transition-colors hover:border-flame-600 hover:text-flame-600"
            >
              Read the projects
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </Reveal>
      </div>
    );
  }

  return (
    <div className="rails pt-12 pb-20 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
      <ul className="border-t border-rule">
        {posts.map((post, i) => (
          <Reveal as="li" key={post.slug} delay={i * 70}>
            <article className="group relative grid gap-4 border-b border-rule py-9 sm:px-2 lg:grid-cols-[auto_1fr_auto] lg:items-baseline lg:gap-10">
              <span className="label relative text-ink-mute">
                <span
                  aria-hidden
                  className="absolute top-1/2 -left-3 h-5 w-0.5 -translate-y-1/2 scale-y-0 bg-flame-500 transition-transform duration-300 group-hover:scale-y-100 lg:-left-4"
                />
                {String(i + 1).padStart(2, "0")}
              </span>

              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="label text-flame-600">{post.category}</span>
                  <time className="text-[12.5px] text-ink-mute" dateTime={post.date}>
                    {fmt(post.date)}
                  </time>
                  <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-mute">
                    <Clock className="size-3.5" />
                    {post.readingTime}
                  </span>
                </div>

                <h2 className="mt-3 font-display text-2xl leading-tight font-bold tracking-[-0.02em] transition-colors group-hover:text-flame-600 sm:text-3xl">
                  {/* The pseudo-element makes the whole row the hit area */}
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="after:absolute after:inset-0"
                  >
                    {post.title}
                  </Link>
                </h2>

                <p className="mt-3 text-[14.5px] leading-relaxed text-ink-mute">
                  {post.excerpt}
                </p>
              </div>

              <ArrowUpRight className="size-5 text-ink-mute transition-all group-hover:text-flame-600 lg:translate-y-0.5 group-hover:lg:translate-x-0.5 group-hover:lg:-translate-y-0" />
            </article>
          </Reveal>
        ))}
      </ul>

    </div>
  );
}
