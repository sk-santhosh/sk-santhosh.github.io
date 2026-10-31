import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { site } from "@/data/content";

/**
 * Open Graph cards, shared by every route's `opengraph-image`.
 *
 * Two layouts, both closing on the same white footer bar:
 *   ogImage  inner pages — coal panel, the page URL, title and lede
 *   ogHome   the home screen in miniature — flame, watermark, cut-out
 *
 * Fonts and images are read off disk rather than fetched, so the cards
 * render at build time without network access. The folder is `_og` so
 * Next treats it as private and never routes it.
 */

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const DIR = path.join(process.cwd(), "src", "app", "_og");
const read = (file: string) => fs.readFileSync(path.join(DIR, file));
const dataUri = (file: string) =>
  `data:image/png;base64,${read(file).toString("base64")}`;

const MARK = dataUri("mark.png");
const PORTRAIT = dataUri("portrait.png");

const FONTS = [
  { name: "Archivo", data: read("fonts/Archivo-700.ttf"), weight: 700 as const },
  { name: "Archivo", data: read("fonts/Archivo-800.ttf"), weight: 800 as const },
  { name: "Inter", data: read("fonts/Inter-400.ttf"), weight: 400 as const },
  { name: "Inter", data: read("fonts/Inter-700.ttf"), weight: 700 as const },
];

const FLAME = "#e9491f";
const COAL = "#131313";

/* Proportions are taken from the reference comps (a 914x525 frame whose
   panel is inset 23px) and scaled to 1200x630.

   The card is white throughout: the coal/flame panel sits inside a white
   border, and the footer row occupies the band between the panel and the
   bottom border. */
const BORDER = 30; // white margin around the panel
const INSET = 28; // panel's own padding, inside the border
const FOOTER = 114; // panel bottom to card bottom, border included
const PANEL = size.height - BORDER - FOOTER;

/* The panel is a fixed box, so title and lede have to be fitted into it.
   Post titles run to ~100 characters where a project title is ~30, and at
   a fixed size the title overflowed: it rode up over the URL and sliced
   the lede off at the bottom edge. */
const PANEL_W = size.width - BORDER * 2 - INSET * 2;
const CONTENT_H = PANEL - INSET * 2;
const URL_H = 38 * 1.25;
const LEDE_W = 1040;
const LEDE_SIZE = 32;
const LEDE_LH = 1.45;
const TITLE_LH = 1.08;
const GAP = 40; // title to lede

/* Both faces average a little over half an em per character at these
   sizes; 0.52 keeps the estimate on the pessimistic side, so a line is
   never assumed to hold more than it does. */
const EM = 0.52;

function lineCount(text: string, fontSize: number, width: number) {
  return Math.max(1, Math.ceil((text.length * fontSize * EM) / width));
}

const TITLE_SIZES = [104, 86, 70, 58, 50, 44];

/** The size this title would take if the panel were unbounded. */
function naturalSize(title: string) {
  if (title.length <= 22) return 104;
  if (title.length <= 44) return 86;
  return 70;
}

function clamp(text: string, max = 170) {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(" ", max))}…`;
}

/**
 * Largest title size that leaves the whole lede inside the panel. The
 * title gives way first — a card whose note is cut off mid-word reads as
 * broken, where a slightly smaller headline does not. Only if even the
 * smallest title will not fit is the lede itself trimmed harder.
 */
function fit(title: string, lede: string) {
  const sizes = TITLE_SIZES.filter((s) => s <= naturalSize(title));

  for (const max of [170, 140, 115]) {
    const text = lede ? clamp(lede, max) : "";
    const ledeH = text
      ? GAP + lineCount(text, LEDE_SIZE, LEDE_W) * LEDE_SIZE * LEDE_LH
      : 0;

    for (const titleSize of sizes) {
      const titleH = lineCount(title, titleSize, PANEL_W) * titleSize * TITLE_LH;
      if (URL_H + titleH + ledeH <= CONTENT_H) return { titleSize, lede: text };
    }
  }

  return { titleSize: sizes[sizes.length - 1], lede: clamp(lede, 115) };
}

/** The white bar every card ends on: who this is, and the mark. */
function Footer() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: FOOTER,
        /* Centred in the whole band, not just the part above the bottom
           border — otherwise the row sits high and the gap below it reads
           as a mistake. */
        backgroundColor: "#ffffff",
      }}
    >
      <div
        style={{
          display: "flex",
          /* Inter, not the display face: Archivo sets "&" as an
             epsilon-form et, which misreads at this size. */
          fontWeight: 700,
          fontSize: 33,
          letterSpacing: "-0.01em",
          color: COAL,
        }}
      >
        {`${site.fullName} - ${site.role}`}
      </div>
      {/* Satori rasterises this tree itself; next/image has no part in it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={MARK} width={83} height={65} alt="" />
    </div>
  );
}

export type Card = { url: string; title: string; lede: string };

/** Inner pages: coal panel carrying the URL, the title and the lede. */
export function ogImage({ url, title, lede }: Card) {
  const fitted = fit(title, lede);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: `${BORDER}px ${BORDER}px 0`,
          backgroundColor: "#ffffff",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: PANEL,
            padding: INSET,
            backgroundColor: COAL,
          }}
        >
          <div style={{ display: "flex", fontSize: 38, color: "#c9c9c9" }}>
            {url}
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo",
                fontWeight: 700,
                fontSize: fitted.titleSize,
                lineHeight: TITLE_LH,
                letterSpacing: "-0.025em",
                color: "#ffffff",
              }}
            >
              {title}
            </div>
            {fitted.lede ? (
              <div
                style={{
                  display: "flex",
                  marginTop: GAP,
                  maxWidth: LEDE_W,
                  fontSize: LEDE_SIZE,
                  lineHeight: LEDE_LH,
                  color: "#c4c4c4",
                }}
              >
                {fitted.lede}
              </div>
            ) : null}
          </div>
        </div>

        <Footer />
      </div>
    ),
    { ...size, fonts: FONTS },
  );
}

/** Home: the locked home screen in miniature. */
export function ogHome() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          padding: `${BORDER}px ${BORDER}px 0`,
          backgroundColor: "#ffffff",
          fontFamily: "Inter",
        }}
      >
        <div
          style={{
            display: "flex",
            position: "relative",
            height: PANEL,
            width: "100%",
            backgroundColor: FLAME,
          }}
        >
          {/* Watermark name, rail to rail, as on the home screen */}
          <div
            style={{
              display: "flex",
              position: "absolute",
              top: 34,
              left: INSET,
              width: size.width - BORDER * 2 - INSET * 2,
              justifyContent: "space-between",
              fontFamily: "Archivo",
              fontWeight: 800,
              fontSize: 196,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.2)",
            }}
          >
            {"SANTHOSH".split("").map((c, i) => (
              <span key={i}>{c}</span>
            ))}
          </div>

          {/* Cut-out, anchored to the foot of the panel */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={PORTRAIT}
            width={482}
            height={486}
            alt=""
            style={{ position: "absolute", left: INSET, bottom: 0 }}
          />

          {/* Name and domain, right-aligned into the corner */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              position: "absolute",
              right: INSET,
              bottom: 30,
            }}
          >
            <div
              style={{
                display: "flex",
                fontFamily: "Archivo",
                fontWeight: 800,
                /* Sized to clear the cut-out: the panel is 1140 wide and
                   the portrait takes the left 510 of it. */
                fontSize: 100,
                lineHeight: 1,
                letterSpacing: "-0.02em",
                color: "#ffffff",
              }}
            >
              {site.name}
            </div>
            <div
              style={{
                display: "flex",
                marginTop: 14,
                fontSize: 40,
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {site.domain}
            </div>
          </div>
        </div>

        <Footer />
      </div>
    ),
    { ...size, fonts: FONTS },
  );
}
