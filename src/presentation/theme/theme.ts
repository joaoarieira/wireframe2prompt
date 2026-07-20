const THEME_STORAGE_KEY = "wireframe2prompt-theme";
const THEME_NAME = {
  light: "wireframe-light",
  dark: "wireframe-dark",
} as const;

/** A concrete rendered scheme. */
export type ColorScheme = keyof typeof THEME_NAME;
/** What the user picked: an explicit scheme, or "system" (follow the OS). */
export type ThemePreference = "system" | ColorScheme;

/**
 * The stored preference. Only an explicit light/dark is persisted; anything
 * else (empty, garbage, "system") means "follow the OS".
 */
export function resolvePreference(): ThemePreference {
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return "system";
}

/** The OS scheme via `prefers-color-scheme`. */
function osScheme(): ColorScheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** The concrete scheme a preference renders to ("system" → the OS scheme). */
export function schemeForPreference(preference: ThemePreference): ColorScheme {
  return preference === "system" ? osScheme() : preference;
}

/** The concrete scheme to render right now (stored preference or OS). */
export function resolveScheme(): ColorScheme {
  return schemeForPreference(resolvePreference());
}

/** Writes `data-theme` on `<html>`. Does NOT persist. */
export function applyScheme(scheme: ColorScheme): void {
  document.documentElement.setAttribute("data-theme", THEME_NAME[scheme]);
}

/**
 * Persists an explicit user choice, then applies it. Picking "system" clears
 * the stored value so the app follows the OS again.
 */
export function choosePreference(preference: ThemePreference): void {
  if (preference === "system") {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } else {
    localStorage.setItem(THEME_STORAGE_KEY, preference);
  }
  applyScheme(schemeForPreference(preference));
}

/**
 * Applies the stored (or OS-derived) scheme at boot.
 * Called once from main.tsx before render.
 *
 * @example initTheme();
 */
export function initTheme(): void {
  applyScheme(resolveScheme());
}
