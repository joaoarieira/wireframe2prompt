import { describe, expect, test } from "vitest";
import { StringRenderer } from "./StringRenderer";
import { GridSize } from "../../domain/entities/grid-size/GridSize";
import { Position } from "../../domain/entities/position/Position";
import { CellChar } from "../../domain/entities/cell-char/CellChar";

describe("StringRenderer", () => {
  test("renders an empty grid as spaces", () => {
    const renderer = new StringRenderer(GridSize.create(2, 2));
    expect(renderer.toString()).toBe("  \n  ");
  });

  test("drawChar writes a single cell", () => {
    const renderer = new StringRenderer(GridSize.create(3, 1));
    renderer.drawChar(Position.create(2, 0), CellChar.create("Z"));
    expect(renderer.toString()).toBe("  Z");
  });

  test("drawText writes characters left to right from the position", () => {
    const renderer = new StringRenderer(GridSize.create(6, 1));
    renderer.drawText(Position.create(1, 0), "Hi!");
    expect(renderer.toString()).toBe(" Hi!  ");
  });

  test("ignores writes outside the grid", () => {
    const renderer = new StringRenderer(GridSize.create(2, 1));
    renderer.drawText(Position.create(1, 0), "ABC");
    expect(renderer.toString()).toBe(" A");
  });

  test("clear resets the buffer to spaces", () => {
    const renderer = new StringRenderer(GridSize.create(2, 1));
    renderer.drawText(Position.create(0, 0), "Hi");
    renderer.clear();
    expect(renderer.toString()).toBe("  ");
  });

  test("getBuffer exposes the underlying CharBuffer", () => {
    const renderer = new StringRenderer(GridSize.create(2, 1));
    renderer.drawChar(Position.create(0, 0), CellChar.create("A"));
    const buffer = renderer.getBuffer();
    expect(buffer.charAt(Position.create(0, 0))).toBe("A");
    expect(buffer.toString()).toBe(renderer.toString());
  });

  test("present is a no-op that leaves the output unchanged", () => {
    const renderer = new StringRenderer(GridSize.create(2, 1));
    renderer.drawText(Position.create(0, 0), "Hi");
    renderer.present();
    expect(renderer.toString()).toBe("Hi");
  });
});
