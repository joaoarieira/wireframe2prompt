import { describe, expect, test } from "vitest";
import { CharBuffer } from "./CharBuffer";
import { GridSize } from "../../entities/grid-size/GridSize";
import { Position } from "../../entities/position/Position";
import { CellChar } from "../../entities/cell-char/CellChar";

describe("CharBuffer", () => {
  test("must be filled with spaces on creation", () => {
    const buffer = CharBuffer.create(GridSize.create(3, 2));
    expect(buffer.toString()).toBe("   \n   ");
  });

  test("must expose width and height from the grid size", () => {
    const buffer = CharBuffer.create(GridSize.create(4, 3));
    expect(buffer.width).toBe(4);
    expect(buffer.height).toBe(3);
  });

  test("set must write a char at the given position", () => {
    const buffer = CharBuffer.create(GridSize.create(3, 1));
    buffer.set(Position.create(1, 0), CellChar.create("X"));
    expect(buffer.charAt(Position.create(1, 0))).toBe("X");
    expect(buffer.toString()).toBe(" X ");
  });

  test("set must ignore writes outside the grid (clamp on rasterization)", () => {
    const buffer = CharBuffer.create(GridSize.create(2, 2));
    buffer.set(Position.create(-1, 0), CellChar.create("X"));
    buffer.set(Position.create(0, -1), CellChar.create("X"));
    buffer.set(Position.create(2, 0), CellChar.create("X"));
    buffer.set(Position.create(0, 2), CellChar.create("X"));
    expect(buffer.toString()).toBe("  \n  ");
  });

  test("last write to a cell wins", () => {
    const buffer = CharBuffer.create(GridSize.create(1, 1));
    buffer.set(Position.create(0, 0), CellChar.create("A"));
    buffer.set(Position.create(0, 0), CellChar.create("B"));
    expect(buffer.charAt(Position.create(0, 0))).toBe("B");
  });
});
