import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleShell from "@/components/ArticleShell";
import { ArrowUpRight, Github } from "@/components/Icons";
import { getProject, getProjects } from "@/lib/content";
import { sharedMetadata } from "@/lib/seo";


/* Only the slugs below exist; anything else is a 404 rather than an
   attempted render. */
export const dynamicParams = false;

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return sharedMetadata({
    path: `/projects/${slug}`,
    title: project.title,
    description: project.blurb,
  });
}

export default async function ProjectPage({
  params,
}: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <ArticleShell
      backHref="/projects"
      backLabel="All projects"
      eyebrow={`${project.category} · ${project.year}`}
      title={project.title}
      lede={project.summary}
      aside={
        <>
          <div>
            <h2 className="label text-ink-mute">Stack</h2>
            <ul className="mt-4 flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <li
                  key={t}
                  className="border border-rule px-2 py-1 text-[11.5px] text-ink-soft"
                >
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {project.impact.length > 0 && (
            <div>
              <h2 className="label text-ink-mute">Impact</h2>
              <dl className="mt-4 flex flex-col gap-4">
                {project.impact.map((m) => (
                  <div key={m.label}>
                    <dd className="font-display text-2xl font-bold text-flame-600">
                      {m.value}
                    </dd>
                    <dt className="label mt-1 text-ink-mute">{m.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {(project.repo || project.demo) && (
            <div className="flex flex-col gap-3 border-t border-rule pt-6">
              {project.repo && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-[13.5px] text-ink transition-colors hover:text-flame-600"
                >
                  <Github className="size-4" />
                  Source
                </a>
              )}
              {project.demo && (
                <a
                  href={project.demo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 text-[13.5px] text-ink transition-colors hover:text-flame-600"
                >
                  Live
                  <ArrowUpRight className="size-3.5" />
                </a>
              )}
            </div>
          )}
        </>
      }
      footer={
        <Link
          href="/contact"
          className="group inline-flex items-center gap-2 bg-flame-700 px-6 py-4 text-[14px] font-semibold text-white transition-colors hover:bg-flame-600"
        >
          Talk to me about work like this
          <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      }
      html={project.html}
    />
  );
}
