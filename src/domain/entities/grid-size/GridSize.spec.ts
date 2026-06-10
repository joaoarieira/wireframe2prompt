import { describe, expect, test } from "vitest";
import { GridSize } from "./GridSize";
import { Position } from "../position/Position";
import { InvalidGridSizeError } from "../errors/InvalidGridSizeError";

describe("GridSize", () => {
  test("must return a new instance when both values are greater than zero", () => {
    const grid = GridSize.create(1, 2);
    expect(grid.cols).toBe(1);
    expect(grid.rows).toBe(2);
  });

  test("must throw when cols or rows are less than zero", () => {
    expect(() => GridSize.create(0, 1)).toThrow(InvalidGridSizeError);
    expect(() => GridSize.create(-1, 1)).toThrow(InvalidGridSizeError);
    expect(() => GridSize.create(1, 0)).toThrow(InvalidGridSizeError);
    expect(() => GridSize.create(1, -1)).toThrow(InvalidGridSizeError);
  });

  test("must throw when cols or rows are float", () => {
    expect(() => GridSize.create(1, 1.5)).toThrow(InvalidGridSizeError);
    expect(() => GridSize.create(1.5, 1)).toThrow(InvalidGridSizeError);
  });

  test("must contain a position inside the grid", () => {
    const grid = GridSize.create(4, 3);
    expect(grid.contains(Position.create(0, 0))).toBe(true); // first cell
    expect(grid.contains(Position.create(3, 2))).toBe(true); // last cell
  });

  test("must not contain a position on the right/bottom edge", () => {
    const grid = GridSize.create(4, 3);
    expect(grid.contains(Position.create(4, 0))).toBe(false); // right edge
    expect(grid.contains(Position.create(0, 3))).toBe(false); // bottom edge
  });

  test("must not contain a negative position", () => {
    const grid = GridSize.create(4, 3);
    expect(grid.contains(Position.create(-1, 0))).toBe(false);
    expect(grid.contains(Position.create(0, -1))).toBe(false);
  });
});
