import { describe, expect, test } from "vitest";
import { canvasCursor, fingerCursor, pointerCursor } from "./cursorGlyphs";

describe("pointerCursor", () => {
  test("is a themed SVG data URI ending in the default fallback", () => {
    const value = pointerCursor("light");
    expect(value).toContain('url("data:image/svg+xml,');
    expect(value.endsWith(", default")).toBe(true);
  });

  test("uses the light base-content colour on the light theme", () => {
    // "#383d45" is URL-encoded to "%23383d45" inside the data URI.
    expect(pointerCursor("light")).toContain("%23383d45");
    expect(pointerCursor("light")).not.toContain("%23e4e6e9");
  });

  test("flips to the light glyph colour on the dark theme", () => {
    expect(pointerCursor("dark")).toContain("%23e4e6e9");
    expect(pointerCursor("dark")).not.toContain("%23383d45");
  });
});

describe("antialiasing", () => {
  test("the SVG requests geometricPrecision so strokes are antialiased", () => {
    expect(decodeURIComponent(pointerCursor("light"))).toContain(
      'shape-rendering="geometricPrecision"',
    );
  });
});

describe("fingerCursor", () => {
  test("is a themed SVG data URI ending in the pointer fallback", () => {
    const value = fingerCursor("light");
    expect(value).toContain('url("data:image/svg+xml,');
    expect(value.endsWith(", pointer")).toBe(true);
    expect(value).toContain("%23383d45");
  });
});

describe("canvasCursor", () => {
  test("panning yields the grabbing-hand cursor regardless of tool", () => {
    const value = canvasCursor({
      activeToolId: "hand",
      panning: true,
      scheme: "light",
    });
    expect(value).toContain('url("data:image/svg+xml,');
    expect(value.endsWith(", grabbing")).toBe(true);
  });

  test("the idle hand tool yields the open-hand cursor", () => {
    const value = canvasCursor({
      activeToolId: "hand",
      panning: false,
      scheme: "dark",
    });
    expect(value.endsWith(", grab")).toBe(true);
    expect(value).toContain("%23e4e6e9");
  });

  test("any other tool yields the pointer arrow", () => {
    const value = canvasCursor({
      activeToolId: "box",
      panning: false,
      scheme: "light",
    });
    expect(value).toBe(pointerCursor("light"));
  });
});
