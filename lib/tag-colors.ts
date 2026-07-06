// Tag chips draw from the same six hues the rest of the site uses
// (sky = brand, plus blue/violet/emerald/amber/rose) so no colour
// appears on a chip that exists nowhere else on the page.
const palette = [
  "bg-sky-50 border-sky-200 text-sky-700 dark:bg-sky-950 dark:border-sky-800 dark:text-sky-300",
  "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-300",
  "bg-violet-50 border-violet-200 text-violet-700 dark:bg-violet-950 dark:border-violet-800 dark:text-violet-300",
  "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300",
  "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300",
  "bg-rose-50 border-rose-200 text-rose-700 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-300",
];

function hashTag(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) {
    h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function tagColor(tag: string): string {
  return palette[hashTag(tag) % palette.length];
}
