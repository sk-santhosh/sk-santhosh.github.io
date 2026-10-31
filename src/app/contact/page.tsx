import type { Metadata } from "next";
import Contact from "@/components/Contact";
import PageShell from "@/components/PageShell";
import { pages } from "@/data/content";
import { routeMetadata } from "@/lib/seo";

const page = pages["/contact"];

export const metadata: Metadata = routeMetadata("/contact");

export default function ContactPage() {
  return (
    <PageShell
      index={page.index}
      title={page.title}
      lede={page.lede}
    >
      <Contact />
    </PageShell>
  );
}
