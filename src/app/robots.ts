import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

/* Required by `output: "export"` — emitted at build time. */
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        other: {
          "Content-Signal": "search=yes, ai-input=yes, ai-train=yes",
        },
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
