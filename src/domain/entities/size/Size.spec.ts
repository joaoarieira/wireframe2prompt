import { describe, expect, test } from "vitest";
import { Size } from "./Size";
import { InvalidSizeError } from "../errors/InvalidSizeError";

describe("Size", () => {
  test("must create when width and height are positive integers", () => {
    const size = Size.create(4, 3);
    expect(size.width).toBe(4);
    expect(size.height).toBe(3);
  });

  test("must throw when width is zero", () => {
    expect(() => Size.create(0, 3)).toThrow(InvalidSizeError);
  });

  test("must throw when height is zero", () => {
    expect(() => Size.create(3, 0)).toThrow(InvalidSizeError);
  });

  test("must throw when width is negative", () => {
    expect(() => Size.create(-1, 4)).toThrow(InvalidSizeError);
  });

  test("must throw when height is negative", () => {
    expect(() => Size.create(4, -1)).toThrow(InvalidSizeError);
  });

  test("must throw when width is a float", () => {
    expect(() => Size.create(1.5, 3)).toThrow(InvalidSizeError);
  });

  test("must throw when height is a float", () => {
    expect(() => Size.create(3, 1.5)).toThrow(InvalidSizeError);
  });
});
