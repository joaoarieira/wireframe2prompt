import { describe, expect, test } from "vitest";
import { cellAtPoint, isWithinGrid } from "./cellGeometry";
import { Position } from "../../../domain/entities/position/Position";

const rect = { left: 100, top: 50, width: 200, height: 180 };
// 20 cols × 10 rows over 200×180px → cells of 10×18px
const point = (clientX: number, clientY: number) => ({ clientX, clientY });

describe("cellAtPoint", () => {
  test("maps a point to the cell under it", () => {
    expect(cellAtPoint(rect, 20, 10, point(100, 50))).toEqual(
      Position.create(0, 0),
    );
    expect(cellAtPoint(rect, 20, 10, point(109, 67))).toEqual(
      Position.create(0, 0),
    );
    expect(cellAtPoint(rect, 20, 10, point(110, 68))).toEqual(
      Position.create(1, 1),
    );
    expect(cellAtPoint(rect, 20, 10, point(299, 229))).toEqual(
      Position.create(19, 9),
    );
  });

  test("keeps out-of-grid points unclamped so drags can leave and return", () => {
    expect(cellAtPoint(rect, 20, 10, point(85, 40))).toEqual(
      Position.create(-2, -1),
    );
    expect(cellAtPoint(rect, 20, 10, point(305, 230))).toEqual(
      Position.create(20, 10),
    );
  });

  test("scales with the rendered rect (zoomed grid)", () => {
    const zoomed = { left: 0, top: 0, width: 400, height: 360 }; // 2× zoom
    expect(cellAtPoint(zoomed, 20, 10, point(39, 35))).toEqual(
      Position.create(1, 0),
    );
  });

  test("returns null for a degenerate rect", () => {
    expect(cellAtPoint({ ...rect, width: 0 }, 20, 10, point(0, 0))).toBeNull();
    expect(cellAtPoint({ ...rect, height: 0 }, 20, 10, point(0, 0))).toBeNull();
  });
});

describe("isWithinGrid", () => {
  test("accepts inside cells and rejects edges past the grid", () => {
    expect(isWithinGrid(Position.create(0, 0), 20, 10)).toBe(true);
    expect(isWithinGrid(Position.create(19, 9), 20, 10)).toBe(true);
    expect(isWithinGrid(Position.create(20, 9), 20, 10)).toBe(false);
    expect(isWithinGrid(Position.create(-1, 0), 20, 10)).toBe(false);
  });
});
