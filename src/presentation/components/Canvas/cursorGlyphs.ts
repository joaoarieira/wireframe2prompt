import type { ColorScheme } from "../../theme/theme";

/**
 * Custom canvas cursors rendered from lucide glyphs as inline-SVG data URIs.
 *
 * The OS `crosshair` was near-invisible on the light theme's near-white paper
 * and browsers/OSes render it inconsistently, so we bake the glyph into an SVG
 * cursor whose colour flips with the theme — a dark glyph on light, a light one
 * on dark — kept legible over any cell by a contrasting halo.
 *
 * A data-URI `cursor` can't reference CSS variables, so the colours are concrete
 * here; `fill` mirrors each wireframe theme's `--color-base-content`.
 */

interface GlyphColors {
  /** The glyph body; mirrors the theme's base-content. */
  readonly fill: string;
  /** A halo drawn under the body, in the opposite tone, for contrast. */
  readonly halo: string;
}

const COLORS: Record<ColorScheme, GlyphColors> = {
  light: { fill: "#383d45", halo: "#ffffff" },
  dark: { fill: "#e4e6e9", halo: "#1a1a1a" },
};

/** lucide `mouse-pointer-2` — the default pointer for every non-move tool. */
const MOUSE_POINTER_2 = [
  "M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z",
];

/** lucide `hand` — the idle cursor for the move (hand) tool. */
const HAND = [
  "M18 11V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2",
  "M14 10V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2",
  "M10 10.5V6a2 2 0 0 0-2-2a2 2 0 0 0-2 2v8",
  "M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
];

/** lucide `pointer` — the finger cursor for clickable controls (was CSS pointer). */
const POINTER = [
  "M22 14a8 8 0 0 1-8 8",
  "M18 11v-1a2 2 0 0 0-2-2a2 2 0 0 0-2 2",
  "M14 10V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1",
  "M10 9.5V4a2 2 0 0 0-2-2a2 2 0 0 0-2 2v10",
  "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15",
];

/** lucide `hand-grab` — the move (hand) tool while a pan is in progress. */
const HAND_GRAB = [
  "M18 11.5V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v1.4",
  "M14 10V8a2 2 0 0 0-2-2a2 2 0 0 0-2 2v2",
  "M10 9.9V9a2 2 0 0 0-2-2a2 2 0 0 0-2 2v5",
  "M6 14a2 2 0 0 0-2-2a2 2 0 0 0-2 2",
  "M18 11a2 2 0 1 1 4 0v3a8 8 0 0 1-8 8h-4a8 8 0 0 1-8-8 2 2 0 1 1 4 0",
];

/**
 * Builds a `cursor` value for a glyph: a fat halo path underneath and the body
 * on top. `solid` fills the shape (the arrow reads as a solid pointer); left
 * false the glyph stays a lucide-style outline (the hands).
 */
function cursorValue(
  paths: readonly string[],
  solid: boolean,
  hotspotX: number,
  hotspotY: number,
  fallback: string,
  { fill, halo }: GlyphColors,
): string {
  const halos = paths
    .map(
      (d) =>
        `<path d="${d}" fill="${solid ? halo : "none"}" stroke="${halo}" stroke-width="3.5"/>`,
    )
    .join("");
  const body = paths
    .map(
      (d) =>
        `<path d="${d}" fill="${solid ? fill : "none"}" stroke="${fill}" stroke-width="${solid ? 1 : 2}"/>`,
    )
    .join("");
  // shape-rendering="geometricPrecision" forces the browser to antialias the
  // rasterised cursor instead of the default crisp/aliased path — the thin
  // strokes look jagged otherwise at 24px.
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" ` +
    `viewBox="0 0 24 24" shape-rendering="geometricPrecision" ` +
    `stroke-linecap="round" stroke-linejoin="round">${halos}${body}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${hotspotX} ${hotspotY}, ${fallback}`;
}

/**
 * The `mouse-pointer-2` arrow coloured for `scheme` — the app-wide default
 * cursor, so the whole UI (not just the canvas) shares one legible pointer.
 *
 * @example pointerCursor("light")
 */
export function pointerCursor(scheme: ColorScheme): string {
  return cursorValue(MOUSE_POINTER_2, true, 4, 4, "default", COLORS[scheme]);
}

/**
 * The lucide `pointer` finger coloured for `scheme` — the clickable-affordance
 * cursor that replaces CSS `cursor: pointer` app-wide, so links/buttons show a
 * themed glyph instead of the OS hand.
 *
 * @example fingerCursor("dark")
 */
export function fingerCursor(scheme: ColorScheme): string {
  return cursorValue(POINTER, false, 8, 3, "pointer", COLORS[scheme]);
}

/**
 * The canvas cursor for the current tool/pan state, coloured for `scheme`:
 * `hand-grab` while panning, an open `hand` for the idle move tool, else the
 * `mouse-pointer-2` arrow.
 *
 * @example canvasCursor({ activeToolId: "box", panning: false, scheme: "light" })
 */
export function canvasCursor(input: {
  activeToolId: string;
  panning: boolean;
  scheme: ColorScheme;
}): string {
  const colors = COLORS[input.scheme];
  if (input.panning) {
    return cursorValue(HAND_GRAB, false, 12, 12, "grabbing", colors);
  }
  if (input.activeToolId === "hand") {
    return cursorValue(HAND, false, 12, 12, "grab", colors);
  }
  return pointerCursor(input.scheme);
}
