import type { Metadata, Viewport } from "next";
import { Archivo, Inter } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import ScreenLock from "@/components/ScreenLock";
import { site, socials } from "@/data/content";
import { gaId, googleSiteVerification, siteUrl } from "@/lib/seo";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const description = `${site.fullName} — ${site.role}. ${site.tagline}`;
const siteTitle = `${site.fullName} — ${site.role}`;

/* "https://x.com/its_sk__" → "@its_sk__" */
const xHandle = `@${site.x.split("/").filter(Boolean).pop()}`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: site.fullName,
  publisher: site.legalName,
  category: "technology",
  title: {
    default: `${site.fullName} — ${site.role}`,
    template: `%s · ${site.fullName}`,
  },
  description,
  keywords: [
    "Santhosh",
    "SRE",
    "Site Reliability Engineer",
    "Cloud Native",
    "Kubernetes",
    "Terraform",
    "Platform Engineering",
    "DevOps",
    "Observability",
  ],
  authors: [{ name: site.fullName, url: siteUrl }],
  creator: site.fullName,
  alternates: {
    canonical: "/",
    /* Feed discovery — without this the RSS route is unlisted. */
    types: {
      "application/rss+xml": [
        { url: "/rss.xml", title: `${site.fullName} — Writing` },
      ],
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    locale: "en_US",
    siteName: `${site.fullName} · ${site.domain}`,
    title: `${site.fullName} — ${site.role}`,
    description,
    /* Images come from each route's own `opengraph-image`, so a shared
       link always shows the card for the page that was shared. */
  },
  twitter: {
    card: "summary_large_image",
    site: xHandle,
    creator: xHandle,
    title: siteTitle,
    description,
  },
  robots: {
    index: true,
    follow: true,
    /* Let Google show full-size image previews and untruncated snippets;
       the defaults are conservative. */
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  ...(googleSiteVerification
    ? { verification: { google: googleSiteVerification } }
    : {}),
};

export const viewport: Viewport = {
  themeColor: "#ee5126",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/* The `@id`s give Person and WebSite stable identities, so per-page schema
   (BlogPosting, BreadcrumbList) can point at one entity instead of
   redeclaring the author — which is what consolidates the knowledge graph
   for Google and answer engines. */
const personSchema = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: site.legalName,
  alternateName: site.fullName,
  jobTitle: site.role,
  url: siteUrl,
  email: `mailto:${site.email}`,
  image: {
    "@type": "ImageObject",
    url: `${siteUrl}${site.photoFramed}`,
  },
  address: {
    "@type": "PostalAddress",
    addressLocality: site.location.split(",")[0].trim(),
    addressCountry: "IN",
  },
  sameAs: [...socials.filter((s) => s.icon !== "mail").map((s) => s.href), site.x],
  knowsAbout: [
    "Kubernetes",
    "Site Reliability Engineering",
    "Terraform",
    "Observability",
    "Platform Engineering",
  ],
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: siteTitle,
  description,
  url: siteUrl,
  inLanguage: "en",
  author: { "@id": `${siteUrl}/#person` },
  publisher: { "@id": `${siteUrl}/#person` },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-paper text-ink">
        <ScreenLock />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
