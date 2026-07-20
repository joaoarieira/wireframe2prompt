import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { storeLanguage, type SupportedLanguage } from "../i18n/i18n";

/**
 * Current language (`"en"` | `"pt"`) + a setter that switches and persists.
 * The default language stays the browser-detected one (only an explicit choice
 * writes localStorage, via {@link storeLanguage}).
 *
 * @example const { language, setLanguage } = useLanguage();
 */
export function useLanguage() {
  const { i18n } = useTranslation();
  const language: SupportedLanguage = i18n.language.startsWith("pt")
    ? "pt"
    : "en";

  const setLanguage = useCallback(
    (next: SupportedLanguage) => {
      storeLanguage(next);
      void i18n.changeLanguage(next);
    },
    [i18n],
  );

  return { language, setLanguage };
}
