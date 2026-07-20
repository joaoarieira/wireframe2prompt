import { afterEach, describe, expect, test, vi } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { cursorStylesheet, useAppCursors } from "./useAppCursors";
import { fingerCursor, pointerCursor } from "../components/Canvas/cursorGlyphs";
import { useColorScheme } from "./useColorScheme";

vi.mock("./useColorScheme", () => ({
  useColorScheme: vi.fn(() => "light"),
}));

afterEach(() => {
  cleanup();
  document.getElementById("app-cursors")?.remove();
});

describe("cursorStylesheet", () => {
  test("sets the arrow as the default and the finger on clickables", () => {
    const css = cursorStylesheet("dark");
    expect(css).toContain(`:root { cursor: ${pointerCursor("dark")}; }`);
    expect(css).toContain(`${fingerCursor("dark")} !important;`);
    expect(css).toContain("button:not(:disabled)");
    expect(css).toContain(".cursor-pointer");
  });

  test("excludes the canvas resize handle from the finger rule", () => {
    expect(cursorStylesheet("light")).toContain(
      '[role="button"]:not([data-resize-handle])',
    );
  });
});

describe("useAppCursors", () => {
  test("injects one themed stylesheet into <head>", () => {
    vi.mocked(useColorScheme).mockReturnValue("light");
    renderHook(() => useAppCursors());

    const style = document.getElementById("app-cursors");
    expect(style).not.toBeNull();
    expect(style?.textContent).toBe(cursorStylesheet("light"));
  });

  test("reuses the existing style element instead of duplicating it", () => {
    vi.mocked(useColorScheme).mockReturnValue("light");
    renderHook(() => useAppCursors());
    renderHook(() => useAppCursors());

    expect(document.querySelectorAll("#app-cursors")).toHaveLength(1);
  });
});
