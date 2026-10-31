import type { Metadata } from "next";
import PageShell from "@/components/PageShell";
import Projects from "@/components/Projects";
import { pages } from "@/data/content";
import { getProjects } from "@/lib/content";
import { routeMetadata } from "@/lib/seo";

const page = pages["/projects"];

export const metadata: Metadata = routeMetadata("/projects");

export default function ProjectsPage() {
  return (
    <PageShell
      index={page.index}
      title={page.title}
      lede={page.lede}
    >
      <Projects projects={getProjects()} />
    </PageShell>
  );
}
