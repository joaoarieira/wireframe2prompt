import { describe, expect, test } from "vitest";
import { Size } from "./Size";
import { InvalidSizeError } from "../errors/InvalidSizeError";

describe("Size", () => {
  test("must create a size with the given width and height", () => {
    const size = Size.create(4, 3);
    expect(size.width).toBe(4);
    expect(size.height).toBe(3);
  });

  test("must throw when width is zero or negative", () => {
    expect(() => Size.create(0, 3)).toThrow(InvalidSizeError);
    expect(() => Size.create(-1, 3)).toThrow(InvalidSizeError);
  });

  test("must throw when height is zero or negative", () => {
    expect(() => Size.create(3, 0)).toThrow(InvalidSizeError);
    expect(() => Size.create(3, -1)).toThrow(InvalidSizeError);
  });

  test("must throw when width or height is not an integer", () => {
    expect(() => Size.create(2.5, 3)).toThrow(InvalidSizeError);
    expect(() => Size.create(3, 2.5)).toThrow(InvalidSizeError);
  });

  test("two sizes with the same width and height must be equal", () => {
    expect(Size.create(2, 2).equals(Size.create(2, 2))).toBe(true);
    expect(Size.create(2, 2).equals(Size.create(2, 3))).toBe(false);
  });
});
