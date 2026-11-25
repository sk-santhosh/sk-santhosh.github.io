import type { Metadata } from "next";
import Refer from "@/components/Refer";
import PageShell from "@/components/PageShell";
import { pages, site } from "@/data/content";
import { routeMetadata, siteUrl } from "@/lib/seo";

const page = pages["/refer"];

export const metadata: Metadata = routeMetadata("/refer");

const schema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": `${siteUrl}/refer#webpage`,
  url: `${siteUrl}/refer`,
  name: `Refer me · ${site.fullName}`,
  description: page.description,
  mainEntity: { "@id": `${siteUrl}/#person` },
  isPartOf: { "@id": `${siteUrl}/#website` },
};

export default function ReferPage() {
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
        <Refer />
      </PageShell>
    </>
  );
}
