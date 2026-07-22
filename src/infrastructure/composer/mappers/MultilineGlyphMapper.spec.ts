import { describe, expect, test } from "vitest";
import { MultilineGlyphMapper } from "./MultilineGlyphMapper";
import { MultilineElement } from "../../../domain/entities/element/MultilineElement";
import type { MultilinePoint } from "../../../domain/entities/element/MultilineElement";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { BorderStyle } from "../../../domain/value-objects/border-style/BorderStyle";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new MultilineGlyphMapper()),
);

const p = (col: number, row: number): MultilinePoint => ({ col, row });

function render(
  cols: number,
  rows: number,
  points: readonly MultilinePoint[],
  borderStyle?: BorderStyle,
): string {
  const element = MultilineElement.create({
    id: "ml",
    zIndex: 0,
    layerId: null,
    borderStyle,
    points,
  });
  return composer
    .compose(
      WireframeDocument.create({
        id: "d",
        name: "d",
        gridSize: GridSize.create(cols, rows),
        elements: [element],
      }),
    )
    .toString();
}

describe("MultilineGlyphMapper (golden tests)", () => {
  test("right then down → ┐ top-right corner", () => {
    expect(render(4, 3, [p(0, 0), p(3, 0), p(3, 2)])).toBe(
      ["───┐", "   │", "   │"].join("\n"),
    );
  });

  test("left then down → ┌ top-left corner", () => {
    expect(render(4, 3, [p(3, 0), p(0, 0), p(0, 2)])).toBe(
      ["┌───", "│   ", "│   "].join("\n"),
    );
  });

  test("down, right, up → └ and ┘ bottom corners", () => {
    expect(render(4, 3, [p(0, 0), p(0, 2), p(3, 2), p(3, 0)])).toBe(
      ["│  │", "│  │", "└──┘"].join("\n"),
    );
  });

  test("the rounded border style uses arc corners", () => {
    expect(
      render(4, 3, [p(0, 0), p(0, 2), p(3, 2), p(3, 0)], BorderStyle.rounded()),
    ).toBe(["│  │", "│  │", "╰──╯"].join("\n"));
  });

  test("the cross border style uses ASCII strokes and + corners", () => {
    expect(
      render(4, 3, [p(0, 0), p(0, 2), p(3, 2), p(3, 0)], BorderStyle.cross()),
    ).toBe(["|  |", "|  |", "+--+"].join("\n"));
  });

  test("a collinear path draws a straight line with no corner", () => {
    expect(render(6, 1, [p(0, 0), p(2, 0), p(5, 0)])).toBe("──────");
  });

  test("right, down, right, up, left → the connected multi-corner path", () => {
    expect(
      render(17, 8, [p(0, 0), p(9, 0), p(9, 7), p(16, 7), p(16, 2), p(12, 2)]),
    ).toBe(
      [
        "─────────┐       ",
        "         │       ",
        "         │  ────┐",
        "         │      │",
        "         │      │",
        "         │      │",
        "         │      │",
        "         └──────┘",
      ].join("\n"),
    );
  });
});
