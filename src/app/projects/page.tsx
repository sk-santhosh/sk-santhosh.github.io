import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Projects from "@/components/Projects";
import { pages, site } from "@/data/content";
import { getProjects } from "@/lib/content";
import { routeMetadata, siteUrl } from "@/lib/seo";

const page = pages["/projects"];

export const metadata: Metadata = routeMetadata("/projects");

export default function ProjectsPage() {
  const projects = getProjects();

  const schema = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${siteUrl}/projects#projects`,
      url: `${siteUrl}/projects`,
      name: `${site.fullName} — Projects`,
      description: page.description,
      publisher: { "@id": `${siteUrl}/#person` },
      isPartOf: { "@id": `${siteUrl}/#website` },
      hasPart: projects.map((p) => ({
        "@type": "SoftwareSourceCode",
        name: p.title,
        url: `${siteUrl}/projects/${p.slug}`,
        description: p.summary,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: site.fullName, item: siteUrl },
        { "@type": "ListItem", position: 2, name: "Projects", item: `${siteUrl}/projects` },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <PageShell
        index={page.index}
        title={page.title}
        lede={page.lede}
      >
        <Projects projects={projects} />
      </PageShell>
    </>
  );
}
