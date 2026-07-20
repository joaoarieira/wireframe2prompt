import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { pt } from "./locales/pt";
import { detectLocale } from "./detectLocale";

const LANGUAGE_STORAGE_KEY = "wireframe2prompt-language";
export type SupportedLanguage = "en" | "pt";

/** The languages offered in the switcher; the first is the source of truth. */
export const SUPPORTED_LANGUAGES: readonly SupportedLanguage[] = ["en", "pt"];

/** The manually chosen language from localStorage, or null if none/garbage. */
export function getStoredLanguage(): SupportedLanguage | null {
  const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (stored === "en" || stored === "pt") return stored;
  return null;
}

/** Persists an explicit language choice so it survives a reload. */
export function storeLanguage(language: SupportedLanguage): void {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
}

/**
 * The shared react-i18next instance. Imported for its side effect (init) by
 * `main.tsx` before the first render and by the test setup; components reach it
 * through `useTranslation()`, never by importing this module directly.
 *
 * Resources are inlined, so init is synchronous and `useSuspense` is off — the
 * first render already has the strings, which keeps component specs simple.
 */
void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  lng: getStoredLanguage() ?? detectLocale(navigator.language),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
