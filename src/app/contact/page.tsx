import type { Metadata } from "next";
import Contact from "@/components/Contact";
import PageShell from "@/components/PageShell";
import { pages, site } from "@/data/content";
import { routeMetadata, siteUrl } from "@/lib/seo";

const page = pages["/contact"];

export const metadata: Metadata = routeMetadata("/contact");

const schema = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  "@id": `${siteUrl}/contact#webpage`,
  url: `${siteUrl}/contact`,
  name: `Contact · ${site.fullName}`,
  description: page.description,
  mainEntity: { "@id": `${siteUrl}/#person` },
  isPartOf: { "@id": `${siteUrl}/#website` },
};

export default function ContactPage() {
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
        <Contact />
      </PageShell>
    </>
  );
}
