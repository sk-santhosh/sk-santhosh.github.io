import { nav, pages, site } from "@/data/content";
import { getPosts, getProjects } from "@/lib/content";
import { siteUrl } from "@/lib/seo";

/* https://llmstxt.org — a concise markdown guide to the site for answer
   engines, built from the same content the pages render. */
export const dynamic = "force-static";

export function GET() {
  const routes = nav.filter((item) => item.href !== "/");

  const body = `# ${site.legalName}

> ${site.fullName} — ${site.role}. ${site.tagline}

## Pages

- [Home](${siteUrl}/): ${pages["/"].description}
${routes.map((r) => `- [${pages[r.href].title}](${siteUrl}${r.href}): ${pages[r.href].description}`).join("\n")}

## Projects

${getProjects()
  .map((p) => `- [${p.title}](${siteUrl}/projects/${p.slug}): ${p.blurb}`)
  .join("\n")}

## Writing

${getPosts()
  .map((p) => `- [${p.title}](${siteUrl}/blogs/${p.slug}): ${p.excerpt}`)
  .join("\n")}
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
