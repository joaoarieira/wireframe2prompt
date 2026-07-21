import { describe, expect, test } from "vitest";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonClasses";

// Every button gets the coarse-pointer tap-target minimum, inserted right after
// the size modifier (before active/className).
const COARSE =
  "[@media(pointer:coarse)]:min-h-11 [@media(pointer:coarse)]:min-w-11";

describe("buttonClasses", () => {
  test("always starts with the base btn class and the tap-target minimum", () => {
    expect(buttonClasses("default", "md", false)).toBe(`btn ${COARSE}`);
  });

  test.each<[ButtonVariant, string]>([
    ["default", "btn"],
    ["primary", "btn btn-primary"],
    ["neutral", "btn btn-neutral"],
    ["ghost", "btn btn-ghost"],
    ["danger", "btn btn-outline btn-error"],
  ])("maps the %s variant", (variant, expected) => {
    expect(buttonClasses(variant, "md", false)).toBe(`${expected} ${COARSE}`);
  });

  test.each<[ButtonSize, string]>([
    ["xs", "btn btn-xs"],
    ["sm", "btn btn-sm"],
    ["md", "btn"],
  ])("maps the %s size", (size, expected) => {
    expect(buttonClasses("default", size, false)).toBe(`${expected} ${COARSE}`);
  });

  test("appends btn-active only when active", () => {
    expect(buttonClasses("default", "md", true)).toBe(
      `btn ${COARSE} btn-active`,
    );
  });

  test("appends the caller's layout className last", () => {
    expect(buttonClasses("primary", "sm", false, "mt-2 w-full")).toBe(
      `btn btn-primary btn-sm ${COARSE} mt-2 w-full`,
    );
  });

  test("compact defers the tap-target minimum to lg screens", () => {
    // Dense strips (the tool palette) keep their visual size on small touch
    // screens; the 44px floor only returns at desktop widths.
    expect(buttonClasses("ghost", "sm", false, undefined, true)).toBe(
      "btn btn-ghost btn-sm lg:[@media(pointer:coarse)]:min-h-11 lg:[@media(pointer:coarse)]:min-w-11",
    );
  });
});
