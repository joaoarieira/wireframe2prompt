import "@testing-library/jest-dom";
import { vi } from "vitest";
import i18n from "../presentation/i18n/i18n";

// jsdom has no matchMedia; useTheme's resolveScheme calls it on every render.
// Default to "light" (matches: false); theme specs override this as needed.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn(() => ({ matches: false })),
    configurable: true,
    writable: true,
  });
}

// Determinism: every component spec renders against English regardless of the
// host's navigator.language, so getByText/getByLabelText queries stay stable.
void i18n.changeLanguage("en");
