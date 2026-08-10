import { describe, expect, test } from "vitest";
import { isTitleCell, titleRegion } from "./titleGeometry";
import { Position } from "../position/Position";
import { Size } from "../size/Size";

describe("titleRegion", () => {
  test("sits on the second row, two columns in", () => {
    const region = titleRegion(Position.create(3, 4), Size.create(12, 6), 4);
    expect(region.position.equals(Position.create(5, 5))).toBe(true);
    expect(region.size.equals(Size.create(8, 1))).toBe(true);
  });

  test("reserves more columns when asked (modal close button)", () => {
    const region = titleRegion(Position.create(0, 0), Size.create(12, 6), 6);
    expect(region.size.equals(Size.create(6, 1))).toBe(true);
  });

  test("stays at least one cell wide on a box narrower than the reserve", () => {
    const region = titleRegion(Position.create(0, 0), Size.create(3, 5), 4);
    expect(region.size.equals(Size.create(1, 1))).toBe(true);
  });
});

describe("isTitleCell", () => {
  const position = Position.create(2, 2);
  const size = Size.create(6, 5);

  test("true anywhere on the title row, including both borders", () => {
    expect(isTitleCell(position, size, Position.create(2, 3))).toBe(true);
    expect(isTitleCell(position, size, Position.create(7, 3))).toBe(true);
  });

  test("false on the top border, the separator and the body", () => {
    expect(isTitleCell(position, size, Position.create(4, 2))).toBe(false);
    expect(isTitleCell(position, size, Position.create(4, 4))).toBe(false);
  });

  test("false outside the element's columns", () => {
    expect(isTitleCell(position, size, Position.create(1, 3))).toBe(false);
    expect(isTitleCell(position, size, Position.create(8, 3))).toBe(false);
  });

  test("false when the box is too short for the mapper to draw a title", () => {
    const short = Size.create(6, 2);
    expect(isTitleCell(position, short, Position.create(4, 3))).toBe(false);
  });
});
