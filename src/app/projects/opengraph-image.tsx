import { ogImage, size, contentType } from "../_og/card";
import { pages, site } from "@/data/content";

/* Required by `output: "export"` — the card is rendered at build time. */
export const dynamic = "force-static";

export { size, contentType };
export const alt = `${pages["/projects"].title} · ${site.fullName}`;

export default function Image() {
  const page = pages["/projects"];
  return ogImage({
    url: `${site.domain}/projects`,
    title: page.title,
    lede: page.lede,
  });
}
