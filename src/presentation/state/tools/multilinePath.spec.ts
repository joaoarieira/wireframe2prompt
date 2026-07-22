import { describe, expect, test } from "vitest";
import { extendMultilinePath } from "./multilinePath";
import { Position } from "../../../domain/entities/position/Position";

const pos = (col: number, row: number) => Position.create(col, row);

/** Compact [col, row] view of a path for readable assertions. */
function coords(points: readonly Position[]): Array<[number, number]> {
  return points.map((point) => [point.col, point.row]);
}

describe("extendMultilinePath", () => {
  test("returns the same path when the cell is the current tip", () => {
    const path = [pos(2, 2)];
    expect(extendMultilinePath(path, pos(2, 2))).toBe(path);
  });

  test("a first horizontal drag extends the single anchor", () => {
    expect(coords(extendMultilinePath([pos(0, 0)], pos(4, 0)))).toEqual([
      [0, 0],
      [4, 0],
    ]);
  });

  test("a first vertical drag runs down the column", () => {
    expect(coords(extendMultilinePath([pos(0, 0)], pos(0, 3)))).toEqual([
      [0, 0],
      [0, 3],
    ]);
  });

  test("a diagonal first drag bends horizontal-then-vertical", () => {
    expect(coords(extendMultilinePath([pos(0, 0)], pos(4, 2)))).toEqual([
      [0, 0],
      [4, 0],
      [4, 2],
    ]);
  });

  test("an equal-delta first drag prefers the horizontal axis", () => {
    expect(coords(extendMultilinePath([pos(0, 0)], pos(2, 2)))).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
    ]);
  });

  test("a taller-than-wide first drag bends vertical-then-horizontal", () => {
    expect(coords(extendMultilinePath([pos(0, 0)], pos(2, 4)))).toEqual([
      [0, 0],
      [0, 4],
      [2, 4],
    ]);
  });

  test("a one-cell sideways wobble on a first drag stays straight", () => {
    expect(coords(extendMultilinePath([pos(0, 0)], pos(4, 1)))).toEqual([
      [0, 0],
      [4, 0],
    ]);
  });

  test("a one-cell wobble along a segment does not start a new segment", () => {
    const path = [pos(0, 0), pos(4, 0)];
    expect(coords(extendMultilinePath(path, pos(6, 1)))).toEqual([
      [0, 0],
      [6, 0],
    ]);
  });

  test("bends only once the sideways travel exceeds one cell", () => {
    const path = [pos(0, 0), pos(4, 0)];
    expect(coords(extendMultilinePath(path, pos(4, 2)))).toEqual([
      [0, 0],
      [4, 0],
      [4, 2],
    ]);
  });

  test("continuing along a horizontal segment slides the tip", () => {
    const path = [pos(0, 0), pos(4, 0)];
    expect(coords(extendMultilinePath(path, pos(7, 0)))).toEqual([
      [0, 0],
      [7, 0],
    ]);
  });

  test("continuing along a vertical segment slides the tip", () => {
    const path = [pos(0, 0), pos(0, 4)];
    expect(coords(extendMultilinePath(path, pos(0, 7)))).toEqual([
      [0, 0],
      [0, 7],
    ]);
  });

  test("turning off a horizontal segment fixes a corner", () => {
    const path = [pos(0, 0), pos(4, 0)];
    expect(coords(extendMultilinePath(path, pos(4, 3)))).toEqual([
      [0, 0],
      [4, 0],
      [4, 3],
    ]);
  });

  test("turning off a vertical segment fixes a corner", () => {
    const path = [pos(0, 0), pos(0, 4)];
    expect(coords(extendMultilinePath(path, pos(3, 4)))).toEqual([
      [0, 0],
      [0, 4],
      [3, 4],
    ]);
  });

  test("reversing onto the previous vertex collapses the segment", () => {
    const path = [pos(0, 0), pos(6, 0)];
    expect(coords(extendMultilinePath(path, pos(0, 0)))).toEqual([[0, 0]]);
  });

  test("traces the whole right-down-right-up-left gesture", () => {
    let path: readonly Position[] = [pos(0, 0)];
    path = extendMultilinePath(path, pos(9, 0)); // right
    path = extendMultilinePath(path, pos(9, 7)); // down
    path = extendMultilinePath(path, pos(16, 7)); // right
    path = extendMultilinePath(path, pos(16, 2)); // up
    path = extendMultilinePath(path, pos(12, 2)); // left
    expect(coords(path)).toEqual([
      [0, 0],
      [9, 0],
      [9, 7],
      [16, 7],
      [16, 2],
      [12, 2],
    ]);
  });
});
