import type { Metadata } from "next";
import About from "@/components/About";
import PageShell from "@/components/PageShell";
import { pages } from "@/data/content";
import { routeMetadata } from "@/lib/seo";

const page = pages["/about"];

export const metadata: Metadata = routeMetadata("/about");

export default function AboutPage() {
  return (
    <PageShell
      index={page.index}
      title={page.title}
      lede={page.lede}
    >
      <About />
    </PageShell>
  );
}
