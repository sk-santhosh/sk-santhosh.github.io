import { ogHome, size, contentType } from "./_og/card";
import { site } from "@/data/content";

/* Required by `output: "export"` — the card is rendered at build time. */
export const dynamic = "force-static";

export { size, contentType };
export const alt = `${site.fullName} — ${site.role}`;

export default function Image() {
  return ogHome();
}
