import { describe, expect, test } from "vitest";
import { GridSize } from "../grid-size/GridSize";
import { CharBuffer } from "./CharBuffer";
import { Position } from "../position/Position";
import { CellChar } from "../cell-char/CellChar";

describe("CharBuffer", () => {
  test("must render a grid full of spaces when empty", () => {
    const buffer = CharBuffer.create(GridSize.create(3, 4));
    const row1 = "    \n";
    const row2 = "    \n";
    const row3 = "    ";
    expect(buffer.toString()).toBe(row1 + row2 + row3);
  });

  test("must render a grid with the setted char", () => {
    const buffer = CharBuffer.create(GridSize.create(2, 4));
    const row1 = "0123\n";
    const row2 = "4567";

    buffer.setChar(Position.create(0, 0), CellChar.create("0"));
    buffer.setChar(Position.create(0, 1), CellChar.create("1"));
    buffer.setChar(Position.create(0, 2), CellChar.create("2"));
    buffer.setChar(Position.create(0, 3), CellChar.create("3"));
    buffer.setChar(Position.create(1, 0), CellChar.create("4"));
    buffer.setChar(Position.create(1, 1), CellChar.create("5"));
    buffer.setChar(Position.create(1, 2), CellChar.create("6"));
    buffer.setChar(Position.create(1, 3), CellChar.create("7"));

    expect(buffer.toString()).toBe(row1 + row2);
  });

  test("must ignore setChar when position is outside the grid", () => {
    const buffer = CharBuffer.create(GridSize.create(2, 2));
    buffer.setChar(Position.create(5, 0), CellChar.create("X")); // row fora
    buffer.setChar(Position.create(0, 5), CellChar.create("X")); // col fora
    buffer.setChar(Position.create(-1, 0), CellChar.create("X")); // negativo
    buffer.setChar(Position.create(0, -1), CellChar.create("X")); // negativo
    expect(buffer.toString()).toBe("  \n" + "  ");
  });
});
