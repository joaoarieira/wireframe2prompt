/** The locales the app ships. `en` is the fallback / source of truth. */
export type SupportedLocale = "en" | "pt";

/**
 * Picks a supported locale from a BCP-47 language tag (e.g. `navigator.language`).
 * Pure by design — no `navigator` access — so it is fully unit-testable.
 * Anything starting with `pt` (pt, pt-BR, pt-PT…) maps to Portuguese; every
 * other tag falls back to English.
 *
 * @example
 * detectLocale("pt-BR"); // "pt"
 * detectLocale("en-US"); // "en"
 */
export function detectLocale(language: string): SupportedLocale {
  return language.startsWith("pt") ? "pt" : "en";
}
