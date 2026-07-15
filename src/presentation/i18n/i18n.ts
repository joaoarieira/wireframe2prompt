import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./locales/en";
import { pt } from "./locales/pt";
import { detectLocale } from "./detectLocale";

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
  lng: detectLocale(navigator.language),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

export default i18n;
