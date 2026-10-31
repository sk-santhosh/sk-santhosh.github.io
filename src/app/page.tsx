import Image from "next/image";
import FitWidth from "@/components/FitWidth";
import GridOverlay from "@/components/GridOverlay";
import Nav from "@/components/Nav";
import AvailabilityCard from "@/components/AvailabilityCard";
import TalkCard from "@/components/TalkCard";
import { site } from "@/data/content";
import { getNavCounts } from "@/lib/content";

/**
 * The statement is set in uppercase, which would flatten the lowercase
 * plural on an acronym — "SLOs" renders as "SLOS" and stops reading as
 * a plural. The data stays plain text, since the OG card and the meta
 * description want it that way; only the rendered line keeps the "s"
 * in its own case.
 */
function pluralisedAcronyms(text: string) {
  return text.split(/(\b[A-Z]{2,}s\b)/).map((part, i) =>
    /^[A-Z]{2,}s$/.test(part) ? (
      <span key={i}>
        {part.slice(0, -1)}
        <span className="normal-case">s</span>
      </span>
    ) : (
      part
    ),
  );
}

/**
 * Home is a single, non-scrolling screen locked to the viewport.
 * `data-screen="locked"` is what pins <body> (see globals.css).
 *
 * Every element is placed on the layout rails: left edges sit on
 * --rail-1, right edges on --rail-4, so content lines up with the
 * drawn grid rather than floating inside arbitrary padding.
 */
export default function Home() {
  return (
    <div
      data-screen="locked"
      id="main"
      className="bg-flame relative h-svh w-full overflow-hidden text-white"
    >
      {/* ScreenLock only adds .screen-locked after hydration, so until then
          the root element had no ground of its own and showed through white
          at the edges — which is also the colour iOS Safari samples when it
          tints its toolbars. Rendered with the page, so the first paint is
          already right and it unmounts on navigation away. */}
      <style>{`html{background-color:var(--color-flame-500)}`}</style>

      <GridOverlay on="flame" />

      {/* ------------------------------------------- Watermark name
          Runs the full page rather than rail-1 → rail-4, and overshoots
          3% at each end so the outer letters bleed off the edges — the
          screen's own overflow does the cropping. `fallbackVw` tracks
          that wider box so the pre-hydration size lands close. */}
      <div className="animate-fade pointer-events-none absolute top-[12%] -inset-x-[3%] z-0 select-none">
        <FitWidth
          text={site.name}
          fallbackVw={18}
          className="text-white/12"
        />
      </div>

      {/* ------------------------------------------- Portrait
          Background-removed cut-out, so it needs no blending.
          object-cover against a 0.66 box crops the full-length figure
          to head-and-torso and anchors it to the bottom of the screen.

          The phone height is what the dropped statement freed up: the
          box grows from the bottom, so the extra height carries the
          figure up until the hair starts inside the watermark on every
          handset, which is where the head is meant to meet it. Past
          this the head reaches the nav on the shortest screens. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center lg:translate-x-[4%]">
        <div className="animate-portrait-in relative aspect-72/100 h-[86svh] max-w-[96vw] sm:h-[84svh] lg:h-[93svh]">
          <Image
            src={site.photo}
            alt={`${site.fullName}, ${site.role}`}
            fill
            priority
            sizes="(max-width: 640px) 92vw, (max-width: 1024px) 60vw, 42vw"
            /* The cut-out is a full-length figure, so covering a box only
               96vw wide leaves the head small on a phone. Scaling from the
               top crops into the frame instead; the overflow is clipped by
               the locked screen. */
            className="origin-top scale-125 object-cover object-top sm:scale-100"
          />
        </div>
      </div>

      {/* Grades the lower portrait into the field so the name stays legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[52%] bg-gradient-to-t from-flame-700 via-flame-600/75 to-transparent"
      />

      <Nav onFlame counts={getNavCounts()} />

      {/* ------------------------------------------- Statement
          Left edge on rail-1, running to rail-2. Dropped on phones,
          where the screen belongs to the portrait and the two cards. */}
      <p
        style={{ textIndent: "2.6em" }}
        className="rail-l animate-rise absolute top-[33%] z-20 hidden w-[min(30%,22rem)] min-w-[13rem] text-[13px] leading-[1.65] tracking-[0.07em] uppercase sm:block lg:top-[37%] lg:text-[15px] [animation-delay:260ms]"
      >
        {pluralisedAcronyms(site.statement.join(" "))}
      </p>

      {/* ------------------------------------------- Name block
          Left edge on rail-1; on desktop the name runs to rail-3.
          Its baseline shares the 10% bottom line with the talk card.

          On phones the offset is in rem, not a percentage: the stack
          below it is a fixed 137px tall whatever the screen, so a
          percentage closed on the name as the viewport got shorter and
          the cards ran through it on small handsets. */}
      <div className="rail-l absolute bottom-[12.5rem] z-20 w-[min(88%,calc(var(--rail-4)-var(--rail-1)))] md:bottom-[10%] md:w-[52%] lg:w-[calc(var(--rail-3)-var(--rail-1))]">
        <p className="animate-rise mb-2 flex flex-wrap items-baseline gap-x-3 text-[11px] font-semibold tracking-[0.18em] uppercase sm:text-[12.5px] [animation-delay:340ms]">
          <span>©{site.year}</span>
          <span aria-hidden className="h-px w-5 bg-white/50" />
          <span className="font-normal opacity-85">{site.role}</span>
        </p>
        <div className="animate-rise [animation-delay:400ms]">
          <FitWidth as="h1" text={site.name} fallbackVw={12} />
        </div>
      </div>

      {/* ------------------------------------------- Availability card
          Right edge on rail-4, top edge shares the statement's line.
          Dropped on short viewports (landscape phones), where it would
          collide with the talk card. */}
      <AvailabilityCard className="rail-rt animate-rise absolute top-[33%] z-20 hidden w-[15%] min-w-[13rem] md:block lg:top-[37%] [animation-delay:560ms] [@media(max-height:620px)]:hidden" />

      {/* ------------------------------------------- Talk card
          Right edge on rail-4, bottom edge shares the name's line. */}
      <TalkCard className="rail-rt animate-rise absolute bottom-[10%] z-20 hidden w-[min(24%,22rem)] min-w-[17rem] md:flex [animation-delay:640ms]" />

      {/* Phones: the work card is dropped and the talk card spans the
          rails, with the availability notice stacked straight on top of
          it — the one place on a phone that is reliably clear of the
          portrait. */}
      <div className="rail-l rail-rt absolute bottom-[4%] z-20 flex flex-col gap-2 md:hidden">
        <AvailabilityCard
          compact
          className="animate-rise [animation-delay:500ms]"
        />
        <TalkCard className="animate-rise [animation-delay:560ms]" />
      </div>
    </div>
  );
}
