import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Nav from "@/components/nav";
import OpenToWorkBanner from "@/components/open-to-work-banner";
import CommandPalette from "@/components/command-palette";
import MobileMenuButton from "@/components/mobile-menu-button";
import ThemeToggle from "@/components/theme-toggle";
import { GoogleAnalytics } from "@next/third-parties/google";
import { resume } from "@/data/resume";
import { siteUrl, googleSiteVerification, gaId } from "@/lib/site";
import "./globals.css";

const siteTitle = `${resume.name} — ${resume.title}`;
const ogImage = {
  url: `${siteUrl}/og.png`,
  width: 1200,
  height: 630,
  alt: siteTitle,
};

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

// e.g. "https://twitter.com/its_sk__" → "@its_sk__"
const twitterHandle = `@${resume.social.twitter.split("/").filter(Boolean).pop()}`;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: `%s — ${resume.name}`,
  },
  description: resume.summary,
  applicationName: resume.name,
  authors: [{ name: resume.name, url: siteUrl }],
  creator: resume.name,
  publisher: resume.name,
  keywords: [
    resume.name,
    "AI Engineer",
    "Software Developer",
    "Platform Engineer",
    "Cloud Engineer",
    "Site Reliability Engineer",
    "SRE",
    "Kubernetes",
    "AWS",
    "DevOps",
    "Terraform",
    "Observability",
    ...resume.skills.slice(0, 12),
  ],
  category: "technology",
  alternates: {
    canonical: "/",
    types: {
      "application/rss+xml": [
        { url: "/rss.xml", title: `${resume.name} — Blog` },
      ],
    },
  },
  robots: {
    index: true,
    follow: true,
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
  openGraph: {
    title: siteTitle,
    description: resume.summary,
    url: siteUrl,
    siteName: resume.name,
    locale: "en_US",
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    site: twitterHandle,
    creator: twitterHandle,
    title: siteTitle,
    description: resume.summary,
    images: [ogImage.url],
  },
};

// schema.org structured data — helps Google build a rich knowledge-panel result.
// `@id` gives Person/WebSite stable identities that page-level schema
// (BlogPosting, ProfilePage, …) can reference instead of redefining.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${siteUrl}/#person`,
  name: resume.name,
  url: siteUrl,
  image: {
    "@type": "ImageObject",
    url: `${siteUrl}/santhosh.jpg`,
    width: 3117,
    height: 3117,
  },
  jobTitle: resume.title,
  description: resume.summary,
  email: `mailto:${resume.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: resume.location,
    addressCountry: "IN",
  },
  sameAs: [resume.social.github, resume.social.linkedin, resume.social.twitter],
  knowsAbout: resume.skills,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${siteUrl}/#website`,
  name: siteTitle,
  description: resume.summary,
  url: siteUrl,
  inLanguage: "en",
  author: { "@id": `${siteUrl}/#person` },
  publisher: { "@id": `${siteUrl}/#person` },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t===null&&d))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-10">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-3 focus:py-2 focus:rounded-md focus:bg-white dark:focus:bg-slate-900 focus:text-sky-600 dark:focus:text-sky-400 focus:border focus:border-slate-200 dark:focus:border-slate-700 focus:text-sm"
        >
          Skip to content
        </a>
        <OpenToWorkBanner />
        <Nav />
        <main id="main-content" className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 nav-blur border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} {resume.name}</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <kbd className="hidden sm:inline-flex px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-mono text-xs">
                ⌘J
              </kbd>
            </div>
          </div>
        </footer>
        <CommandPalette />
        <MobileMenuButton />
        {gaId && <GoogleAnalytics gaId={gaId} />}
      </body>
    </html>
  );
}
