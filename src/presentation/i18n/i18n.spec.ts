import { afterEach, describe, expect, test } from "vitest";
import i18n, { getStoredLanguage, storeLanguage } from "./i18n";

const LANGUAGE_STORAGE_KEY = "wireframe2prompt-language";

// The setup file pins the language to "en"; restore it after each switch so
// the smoke test cannot leak Portuguese into other tests in this file.
afterEach(async () => {
  await i18n.changeLanguage("en");
});

describe("i18n instance", () => {
  test("resolves English strings by default", () => {
    expect(i18n.t("toolbar.undo")).toBe("Undo");
    expect(i18n.t("copyOutput.idle")).toBe("COPY OUTPUT");
  });

  test("interpolates {{name}} without escaping", () => {
    expect(i18n.t("layers.bringForward", { name: "Hero & CTA" })).toBe(
      "Bring Hero & CTA forward",
    );
  });

  test("switches the whole dictionary to Portuguese on demand", async () => {
    await i18n.changeLanguage("pt");

    expect(i18n.t("toolbar.undo")).toBe("Desfazer");
    expect(i18n.t("elementKind.box")).toBe("retângulo");
  });

  test("keeps <html lang> in sync with the active language", async () => {
    await i18n.changeLanguage("pt");
    expect(document.documentElement.lang).toBe("pt");

    await i18n.changeLanguage("en");
    expect(document.documentElement.lang).toBe("en");
  });
});

describe("language persistence", () => {
  afterEach(() => {
    localStorage.removeItem(LANGUAGE_STORAGE_KEY);
  });

  test("getStoredLanguage returns a stored supported language", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    expect(getStoredLanguage()).toBe("en");

    localStorage.setItem(LANGUAGE_STORAGE_KEY, "pt");
    expect(getStoredLanguage()).toBe("pt");
  });

  test("getStoredLanguage returns null when empty or unsupported", () => {
    expect(getStoredLanguage()).toBeNull();

    localStorage.setItem(LANGUAGE_STORAGE_KEY, "de");
    expect(getStoredLanguage()).toBeNull();
  });

  test("storeLanguage persists the choice", () => {
    storeLanguage("pt");
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("pt");
  });
});
