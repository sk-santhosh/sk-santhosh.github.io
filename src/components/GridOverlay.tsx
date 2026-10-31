/**
 * The one layout grid, drawn identically on every page: four vertical
 * rails and two horizontals pinned to the viewport, with "+" registration
 * marks at the intersections.
 *
 * It is `fixed`, so the rails are identical on every page and content
 * passes behind them rather than dragging the lines around. The four
 * vertical rails are drawn everywhere; the horizontals and the marks are
 * reserved for the non-scrolling home screen, where they frame the hero
 * instead of striking through running text. Positions come from the rail
 * and row tokens in globals.css, the same source page content aligns to.
 * Decorative only.
 */

const COLS = ["var(--rail-1)", "var(--rail-2)", "var(--rail-3)", "var(--rail-4)"];
const ROWS = ["var(--row-1)", "var(--row-2)"];
const MARK_ROWS = ["var(--row-1)", "46%", "var(--row-2)", "93%"];

export default function GridOverlay({
  on = "paper",
}: {
  /** Which surface the grid is drawn over. */
  on?: "flame" | "paper";
}) {
  const onFlame = on === "flame";
  const line = onFlame ? "bg-white/20" : "bg-ink/8";
  const mark = onFlame ? "text-white/40" : "text-ink/20";

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {COLS.map((x) => (
        <span
          key={`c${x}`}
          className={`absolute inset-y-0 w-px ${line}`}
          style={{ left: x }}
        />
      ))}

      {onFlame &&
        ROWS.map((y) => (
          <span
            key={`r${y}`}
            className={`absolute inset-x-0 h-px ${line}`}
            style={{ top: y }}
          />
        ))}

      {onFlame &&
        MARK_ROWS.map((y) =>
          COLS.map((x) => (
            <svg
              key={`m${x}-${y}`}
              viewBox="0 0 12 12"
              className={`absolute size-2.5 -translate-x-1/2 -translate-y-1/2 ${mark}`}
              style={{ left: x, top: y }}
            >
              <path
                d="M6 0v12M0 6h12"
                stroke="currentColor"
                strokeWidth="1"
                fill="none"
              />
            </svg>
          )),
        )}
    </div>
  );
}
