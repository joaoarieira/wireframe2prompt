import { useEffect, useState } from "react";

/** The three structural layout ranges the editor branches on. */
export type ViewportBreakpoint = "phone" | "tablet" | "desktop";

/** Tailwind `md` — tablet range starts here. */
const TABLET_QUERY = "(min-width: 768px)";
/** Tailwind `lg` — desktop range starts here. */
const DESKTOP_QUERY = "(min-width: 1024px)";

/**
 * Pure mapping from the two media-query matches to a breakpoint. Extracted so
 * the three branches can be tested without a DOM.
 *
 * @example breakpointFrom(true, false) // "tablet"
 */
export function breakpointFrom(
  mdMatches: boolean,
  lgMatches: boolean,
): ViewportBreakpoint {
  if (lgMatches) {
    return "desktop";
  }
  if (mdMatches) {
    return "tablet";
  }
  return "phone";
}

/**
 * The current structural breakpoint, re-read whenever the viewport crosses the
 * `md`/`lg` thresholds. Used for layout differences that CSS alone can't express
 * (mounting a bottom-sheet vs an aside). Interaction capabilities (touch) are
 * detected per-event, not here.
 *
 * @example const breakpoint = useViewportBreakpoint();
 */
export function useViewportBreakpoint(): ViewportBreakpoint {
  const [breakpoint, setBreakpoint] = useState<ViewportBreakpoint>(() =>
    readBreakpoint(),
  );
  useEffect(() => {
    const md = window.matchMedia(TABLET_QUERY);
    const lg = window.matchMedia(DESKTOP_QUERY);
    // The lazy initial state already reflects the mount value; the listeners
    // only need to react to later threshold crossings.
    const update = () => setBreakpoint(breakpointFrom(md.matches, lg.matches));
    md.addEventListener("change", update);
    lg.addEventListener("change", update);
    return () => {
      md.removeEventListener("change", update);
      lg.removeEventListener("change", update);
    };
  }, []);
  return breakpoint;
}

function readBreakpoint(): ViewportBreakpoint {
  return breakpointFrom(
    window.matchMedia(TABLET_QUERY).matches,
    window.matchMedia(DESKTOP_QUERY).matches,
  );
}
