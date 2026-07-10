import { describe, expect, test } from "vitest";
import { GridSize } from "./GridSize";
import { InvalidGridSizeError } from "../errors/InvalidGridSizeError";

describe("GridSize", () => {
  test("must create a grid size with the given cols and rows", () => {
    const grid = GridSize.create(80, 24);
    expect(grid.cols).toBe(80);
    expect(grid.rows).toBe(24);
  });

  test("must throw when cols is zero or negative", () => {
    expect(() => GridSize.create(0, 24)).toThrow(InvalidGridSizeError);
    expect(() => GridSize.create(-1, 24)).toThrow(InvalidGridSizeError);
  });

  test("must throw when rows is zero or negative", () => {
    expect(() => GridSize.create(80, 0)).toThrow(InvalidGridSizeError);
    expect(() => GridSize.create(80, -1)).toThrow(InvalidGridSizeError);
  });

  test("must throw when cols or rows is not an integer", () => {
    expect(() => GridSize.create(80.5, 24)).toThrow(InvalidGridSizeError);
    expect(() => GridSize.create(80, 24.5)).toThrow(InvalidGridSizeError);
  });
});
