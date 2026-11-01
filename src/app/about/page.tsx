import type { Metadata } from "next";
import About from "@/components/About";
import PageShell from "@/components/PageShell";
import { pages, site } from "@/data/content";
import { routeMetadata, siteUrl } from "@/lib/seo";

const page = pages["/about"];

export const metadata: Metadata = routeMetadata("/about");

const schema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${siteUrl}/about#webpage`,
  url: `${siteUrl}/about`,
  name: `About · ${site.fullName}`,
  description: page.description,
  mainEntity: { "@id": `${siteUrl}/#person` },
  isPartOf: { "@id": `${siteUrl}/#website` },
};

export default function AboutPage() {
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
        <About />
      </PageShell>
    </>
  );
}
