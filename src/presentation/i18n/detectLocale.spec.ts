import { describe, expect, test } from "vitest";
import { detectLocale } from "./detectLocale";

describe("detectLocale", () => {
  test("maps a bare pt tag to Portuguese", () => {
    expect(detectLocale("pt")).toBe("pt");
  });

  test("maps a regioned pt tag to Portuguese", () => {
    expect(detectLocale("pt-BR")).toBe("pt");
  });

  test("falls back to English for other tags", () => {
    expect(detectLocale("en-US")).toBe("en");
  });

  test("falls back to English for an empty tag", () => {
    expect(detectLocale("")).toBe("en");
  });
});
