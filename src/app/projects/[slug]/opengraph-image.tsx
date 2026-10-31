import { notFound } from "next/navigation";
import { ogImage, size, contentType } from "../../_og/card";
import { site } from "@/data/content";
import { getProject, getProjects } from "@/lib/content";

/* Required by `output: "export"` — the card is rendered at build time. */
export const dynamic = "force-static";

export { size, contentType };

/* A static `alt` rather than a per-slug one from generateImageMetadata:
   that hook adds a [__metadata_id__] segment whose params lose `slug`
   under `output: "export"`. */
export const alt = `${site.fullName} — projects`;

/* Mirrors the page's own params so each card prerenders at build time. */
export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}


export default async function Image({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  /* The section URL, as in the reference comp — the full slug would not
     fit on one line at this size. */
  return ogImage({
    url: `${site.domain}/projects`,
    title: project.title,
    lede: project.blurb,
  });
}
