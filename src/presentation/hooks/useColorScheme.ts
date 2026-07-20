import { useEffect, useState } from "react";
import { type ColorScheme, resolveScheme } from "../theme/theme";

/**
 * The concrete light/dark scheme in effect right now, re-read whenever
 * `data-theme` on <html> changes (a manual toggle via choosePreference). Lets
 * UI that can't use CSS variables — e.g. an SVG data-URI cursor — track the
 * theme.
 *
 * @example const scheme = useColorScheme();
 */
export function useColorScheme(): ColorScheme {
  const [scheme, setScheme] = useState<ColorScheme>(resolveScheme);
  useEffect(() => {
    const observer = new MutationObserver(() => setScheme(resolveScheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);
  return scheme;
}
