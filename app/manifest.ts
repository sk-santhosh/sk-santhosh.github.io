import type { MetadataRoute } from "next";
import { resume } from "@/data/resume";

// Required for `output: "export"` — emit a static manifest at build time.
export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${resume.name} — ${resume.title}`,
    short_name: resume.name,
    description: resume.summary,
    start_url: "/",
    display: "browser",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon.png", type: "image/png", sizes: "180x180" },
    ],
  };
}
