import { afterEach, describe, expect, test, vi } from "vitest";
import {
  applyScheme,
  choosePreference,
  initTheme,
  resolvePreference,
  resolveScheme,
  schemeForPreference,
} from "./theme";

function stubStorage(stored: string | null) {
  const setItem = vi.fn();
  const removeItem = vi.fn();
  vi.stubGlobal("localStorage", {
    getItem: vi.fn(() => stored),
    setItem,
    removeItem,
  });
  return { setItem, removeItem };
}

function stubMatchMedia(prefersDark: boolean) {
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn(() => ({ matches: prefersDark })),
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolvePreference", () => {
  test("returns the stored explicit scheme", () => {
    stubStorage("dark");
    expect(resolvePreference()).toBe("dark");

    stubStorage("light");
    expect(resolvePreference()).toBe("light");
  });

  test('falls back to "system" when storage is empty or garbage', () => {
    stubStorage(null);
    expect(resolvePreference()).toBe("system");

    stubStorage("purple");
    expect(resolvePreference()).toBe("system");
  });
});

describe("schemeForPreference", () => {
  test("returns the explicit scheme as-is", () => {
    stubMatchMedia(true);
    expect(schemeForPreference("light")).toBe("light");
    expect(schemeForPreference("dark")).toBe("dark");
  });

  test('"system" follows the OS preference', () => {
    stubMatchMedia(true);
    expect(schemeForPreference("system")).toBe("dark");

    stubMatchMedia(false);
    expect(schemeForPreference("system")).toBe("light");
  });
});

describe("resolveScheme", () => {
  test("prefers the stored scheme over the OS preference", () => {
    stubStorage("dark");
    stubMatchMedia(false);
    expect(resolveScheme()).toBe("dark");
  });

  test("follows the OS when nothing is stored", () => {
    stubStorage(null);
    stubMatchMedia(true);
    expect(resolveScheme()).toBe("dark");
  });
});

describe("applyScheme", () => {
  test("writes data-theme without persisting", () => {
    const { setItem } = stubStorage(null);

    applyScheme("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "wireframe-dark",
    );

    applyScheme("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "wireframe-light",
    );
    expect(setItem).not.toHaveBeenCalled();
  });
});

describe("choosePreference", () => {
  test("an explicit scheme persists and applies", () => {
    const { setItem } = stubStorage(null);

    choosePreference("dark");

    expect(setItem).toHaveBeenCalledWith("wireframe2prompt-theme", "dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "wireframe-dark",
    );
  });

  test('"system" clears storage and applies the OS scheme', () => {
    const { removeItem, setItem } = stubStorage(null);
    stubMatchMedia(true);

    choosePreference("system");

    expect(removeItem).toHaveBeenCalledWith("wireframe2prompt-theme");
    expect(setItem).not.toHaveBeenCalled();
    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "wireframe-dark",
    );
  });
});

describe("initTheme", () => {
  test("applies the resolved scheme", () => {
    stubStorage("dark");
    stubMatchMedia(false);

    initTheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe(
      "wireframe-dark",
    );
  });
});
