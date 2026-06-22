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

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
    title: siteTitle,
    description: resume.summary,
    images: [ogImage.url],
  },
};

// schema.org structured data — helps Google build a rich knowledge-panel result.
const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: resume.name,
  url: siteUrl,
  image: `${siteUrl}/santhosh.jpg`,
  jobTitle: resume.title,
  description: resume.summary,
  email: `mailto:${resume.email}`,
  address: {
    "@type": "PostalAddress",
    addressLocality: resume.location,
  },
  sameAs: [resume.social.github, resume.social.linkedin, resume.social.twitter],
  knowsAbout: resume.skills,
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: siteTitle,
  url: siteUrl,
  author: { "@type": "Person", name: resume.name },
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
        <OpenToWorkBanner />
        <Nav />
        <main className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
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
