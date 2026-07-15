import { afterEach, describe, expect, test } from "vitest";
import i18n from "./i18n";

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
    expect(i18n.t("elementKind.box")).toBe("caixa");
  });
});
