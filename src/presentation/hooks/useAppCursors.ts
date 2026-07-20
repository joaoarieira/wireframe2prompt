import { useEffect } from "react";
import { fingerCursor, pointerCursor } from "../components/Canvas/cursorGlyphs";
import { useColorScheme } from "./useColorScheme";
import type { ColorScheme } from "../theme/theme";

const STYLE_ID = "app-cursors";

// Clickable affordances that browsers/daisyUI would give `cursor: pointer` —
// we override them with the themed lucide finger. `!important` beats daisyUI's
// own `.btn { cursor: pointer }`; disabled controls are excluded so they keep
// their `not-allowed` cursor.
const CLICKABLE = [
  "a[href]",
  "button:not(:disabled)",
  "select:not(:disabled)",
  "summary",
  "label[for]",
  // The canvas resize handle is a role=button but sets its own themed
  // move-diagonal cursor inline; excluding it keeps this !important finger rule
  // from overriding that.
  '[role="button"]:not([data-resize-handle])',
  '[role="tab"]',
  '[role="menuitem"]',
  ".cursor-pointer",
].join(", ");

/**
 * The global cursor rules for a scheme: the `mouse-pointer-2` arrow as the
 * inherited default, plus the lucide `pointer` finger on clickable controls.
 * The canvas sets its own cursor inline (which wins over `:root`), and the
 * finger selectors never match it.
 *
 * @example cursorStylesheet("light")
 */
export function cursorStylesheet(scheme: ColorScheme): string {
  return (
    `:root { cursor: ${pointerCursor(scheme)}; }\n` +
    `${CLICKABLE} { cursor: ${fingerCursor(scheme)} !important; }`
  );
}

/**
 * Installs the app-wide themed cursors as a single <style> element, refreshed
 * whenever the theme changes. Mount once near the root.
 *
 * @example function RootLayout() { useAppCursors(); return <Outlet />; }
 */
export function useAppCursors(): void {
  const scheme = useColorScheme();
  useEffect(() => {
    let style = document.getElementById(STYLE_ID);
    if (style === null) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = cursorStylesheet(scheme);
  }, [scheme]);
}
