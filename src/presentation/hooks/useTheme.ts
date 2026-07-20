import { useState, useCallback } from "react";
import {
  type ThemePreference,
  resolvePreference,
  choosePreference,
} from "../theme/theme";

/**
 * Current theme preference (`"system" | "light" | "dark"`) + a setter. Setting
 * persists the choice (or clears it for "system") and updates `data-theme` via
 * choosePreference.
 *
 * @example const { preference, setPreference } = useTheme();
 */
export function useTheme() {
  const [preference, setPreference] =
    useState<ThemePreference>(resolvePreference);

  const choose = useCallback((next: ThemePreference) => {
    choosePreference(next);
    setPreference(next);
  }, []);

  return { preference, setPreference: choose };
}
