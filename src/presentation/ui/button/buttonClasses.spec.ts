import { describe, expect, test } from "vitest";
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./buttonClasses";

describe("buttonClasses", () => {
  test("always starts with the base btn class", () => {
    expect(buttonClasses("default", "md", false)).toBe("btn");
  });

  test.each<[ButtonVariant, string]>([
    ["default", "btn"],
    ["primary", "btn btn-primary"],
    ["neutral", "btn btn-neutral"],
    ["ghost", "btn btn-ghost"],
    ["danger", "btn btn-outline btn-error"],
  ])("maps the %s variant", (variant, expected) => {
    expect(buttonClasses(variant, "md", false)).toBe(expected);
  });

  test.each<[ButtonSize, string]>([
    ["xs", "btn btn-xs"],
    ["sm", "btn btn-sm"],
    ["md", "btn"],
  ])("maps the %s size", (size, expected) => {
    expect(buttonClasses("default", size, false)).toBe(expected);
  });

  test("appends btn-active only when active", () => {
    expect(buttonClasses("default", "md", true)).toBe("btn btn-active");
  });

  test("appends the caller's layout className last", () => {
    expect(buttonClasses("primary", "sm", false, "mt-2 w-full")).toBe(
      "btn btn-primary btn-sm mt-2 w-full",
    );
  });
});
