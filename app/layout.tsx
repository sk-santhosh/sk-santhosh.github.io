import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import Nav from "@/components/nav";
import CommandPalette from "@/components/command-palette";
import MobileMenuButton from "@/components/mobile-menu-button";
import ThemeToggle from "@/components/theme-toggle";
import { resume } from "@/data/resume";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  `https://sk-santhosh.info${process.env.NEXT_PUBLIC_BASE_PATH || ""}`;

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
  title: siteTitle,
  description: resume.summary,
  openGraph: {
    title: siteTitle,
    description: resume.summary,
    url: siteUrl,
    siteName: resume.name,
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={jetbrainsMono.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(t===null&&d))document.documentElement.classList.add('dark')}catch(e){}})()` }} />
      </head>
      <body className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-10">
        <Nav />
        <main className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">{children}</main>
        <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-950/95 nav-blur border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-2xl md:max-w-3xl lg:max-w-4xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between">
            <span className="text-xs text-slate-400 dark:text-slate-500">© {new Date().getFullYear()} Santhosh Kumar J</span>
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
      </body>
    </html>
  );
}
