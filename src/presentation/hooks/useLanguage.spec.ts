import { afterEach, describe, expect, test, vi } from "vitest";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useLanguage } from "./useLanguage";
import { storeLanguage } from "../i18n/i18n";
import i18n from "../i18n/i18n";

vi.mock("../i18n/i18n", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../i18n/i18n")>();
  return { ...actual, storeLanguage: vi.fn() };
});

// The setup file pins "en"; restore it so a test's PT switch stays local.
afterEach(async () => {
  cleanup();
  vi.mocked(storeLanguage).mockClear();
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

describe("useLanguage", () => {
  test('returns "en" when the i18n language is English', () => {
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe("en");
  });

  test('returns "pt" when the i18n language starts with "pt" (pt-BR)', async () => {
    await act(async () => {
      await i18n.changeLanguage("pt-BR");
    });
    const { result } = renderHook(() => useLanguage());
    expect(result.current.language).toBe("pt");
  });

  test("setLanguage switches to the chosen language and persists it", async () => {
    const { result } = renderHook(() => useLanguage());

    await act(async () => {
      result.current.setLanguage("pt");
    });

    expect(storeLanguage).toHaveBeenCalledWith("pt");
    expect(i18n.language).toBe("pt");
  });

  test("setLanguage can switch back to English", async () => {
    await act(async () => {
      await i18n.changeLanguage("pt");
    });
    const { result } = renderHook(() => useLanguage());

    await act(async () => {
      result.current.setLanguage("en");
    });

    expect(storeLanguage).toHaveBeenCalledWith("en");
    expect(i18n.language).toBe("en");
  });
});
