import { describe, expect, test } from "vitest";
import { ZIndexComposer } from "./ZIndexComposer";
import { createDefaultGlyphMapperRegistry } from "./defaultRegistry";
import { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Element } from "../../domain/entities/element/Element";
import { GridSize } from "../../domain/entities/grid-size/GridSize";
import { Position } from "../../domain/entities/position/Position";
import { Size } from "../../domain/entities/size/Size";
import { BoxElement } from "../../domain/entities/element/BoxElement";
import { LineElement } from "../../domain/entities/element/LineElement";
import { TextElement } from "../../domain/entities/element/TextElement";

const composer = new ZIndexComposer(createDefaultGlyphMapperRegistry());

const doc = (gridSize: GridSize, ...elements: Element[]) =>
  WireframeDocument.create({ id: "d", name: "d", gridSize, elements });

describe("ZIndexComposer (golden tests)", () => {
  test("draws an empty grid as spaces", () => {
    const result = composer.compose(doc(GridSize.create(3, 2)));
    expect(result.toString()).toBe("   \n   ");
  });

  test("draws a 4x3 box", () => {
    const box = BoxElement.create({
      id: "b",
      position: Position.create(0, 0),
      size: Size.create(4, 3),
      zIndex: 0,
      layerId: null,
    });
    const result = composer.compose(doc(GridSize.create(4, 3), box));
    expect(result.toString()).toBe(["┌──┐", "│  │", "└──┘"].join("\n"));
  });

  test("draws a box offset inside a larger grid", () => {
    const box = BoxElement.create({
      id: "b",
      position: Position.create(1, 1),
      size: Size.create(3, 3),
      zIndex: 0,
      layerId: null,
    });
    const result = composer.compose(doc(GridSize.create(6, 5), box));
    expect(result.toString()).toBe(
      ["      ", " ┌─┐  ", " │ │  ", " └─┘  ", "      "].join("\n"),
    );
  });

  test("draws a horizontal and a vertical line", () => {
    const hLine = LineElement.create({
      id: "h",
      position: Position.create(0, 0),
      size: Size.create(4, 1),
      zIndex: 0,
      layerId: null,
      orientation: "h",
    });
    const vLine = LineElement.create({
      id: "v",
      position: Position.create(0, 0),
      size: Size.create(1, 3),
      zIndex: 0,
      layerId: null,
      orientation: "v",
    });
    expect(composer.compose(doc(GridSize.create(4, 1), hLine)).toString()).toBe(
      "────",
    );
    expect(composer.compose(doc(GridSize.create(1, 3), vLine)).toString()).toBe(
      ["│", "│", "│"].join("\n"),
    );
  });

  test("draws text starting at its position", () => {
    const text = TextElement.create({
      id: "t",
      position: Position.create(1, 1),
      size: Size.create(2, 1),
      zIndex: 0,
      layerId: null,
      text: "OK",
    });
    const result = composer.compose(doc(GridSize.create(5, 3), text));
    expect(result.toString()).toBe(["     ", " OK  ", "     "].join("\n"));
  });

  test("draws multi-line text one row per \\n-separated line", () => {
    const text = TextElement.create({
      id: "t",
      position: Position.create(1, 0),
      size: Size.create(3, 3),
      zIndex: 0,
      layerId: null,
      text: "ab\n\ncde",
    });
    const result = composer.compose(doc(GridSize.create(5, 3), text));
    expect(result.toString()).toBe([" ab  ", "     ", " cde "].join("\n"));
  });

  test("clamps cells drawn outside the grid", () => {
    const box = BoxElement.create({
      id: "b",
      position: Position.create(-1, -1),
      size: Size.create(3, 3),
      zIndex: 0,
      layerId: null,
    });
    // Only the bottom-right quadrant of the box falls inside a 2x2 grid:
    // the right edge at col 1 row 0, the bottom edge at col 0 row 1, and the
    // bottom-right corner at (1, 1).
    const result = composer.compose(doc(GridSize.create(2, 2), box));
    expect(result.toString()).toBe([" │", "─┘"].join("\n"));
  });

  test("higher z-index wins overlapping cells", () => {
    const box = BoxElement.create({
      id: "b",
      position: Position.create(0, 0),
      size: Size.create(2, 2),
      zIndex: 0,
      layerId: null,
    });
    const text = TextElement.create({
      id: "t",
      position: Position.create(0, 0),
      size: Size.create(2, 1),
      zIndex: 5,
      layerId: null,
      text: "XY",
    });
    // Text (z=5) overwrites the box's top corners (z=0); insertion order of the
    // two elements is intentionally box-first to prove ordering is by z-index.
    const result = composer.compose(doc(GridSize.create(2, 2), box, text));
    expect(result.toString()).toBe(["XY", "└┘"].join("\n"));
  });
});
