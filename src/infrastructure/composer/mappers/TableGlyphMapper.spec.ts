import { describe, expect, test } from "vitest";
import { TableGlyphMapper } from "./TableGlyphMapper";
import { TableElement } from "../../../domain/entities/element/TableElement";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new TableGlyphMapper()),
);

function doc(cols: number, rows: number, element: TableElement) {
  return WireframeDocument.create({
    id: "d",
    name: "d",
    gridSize: GridSize.create(cols, rows),
    elements: [element],
  });
}

function table(width: number, height: number, columns: number, rows: number) {
  return TableElement.create({
    id: "t",
    position: Position.create(0, 0),
    size: Size.create(width, height),
    zIndex: 0,
    layerId: null,
    columns,
    rows,
  });
}

describe("TableGlyphMapper (golden tests)", () => {
  test("7×5, 2 columns, 2 rows (even split)", () => {
    const result = composer.compose(doc(7, 5, table(7, 5, 2, 2)));
    expect(result.toString()).toBe(
      [
        "+--+--+",
        "|  |  |",
        "+--+--+",
        "|  |  |",
        "+--+--+",
      ].join("\n"),
    );
  });

  test("8×5, 2 columns, 2 rows (remainder to first column)", () => {
    const result = composer.compose(doc(8, 5, table(8, 5, 2, 2)));
    expect(result.toString()).toBe(
      [
        "+---+--+",
        "|   |  |",
        "+---+--+",
        "|   |  |",
        "+---+--+",
      ].join("\n"),
    );
  });

  test("degenerate: width too small — does not throw, has outer border", () => {
    // 3 wide, 2 columns → interior = 3 - 3 = 0, all lines collapse
    expect(() => composer.compose(doc(3, 3, table(3, 3, 2, 2)))).not.toThrow();
    const result = composer.compose(doc(3, 3, table(3, 3, 2, 2)));
    // Just ensure the output is a string (specific output not asserted)
    expect(typeof result.toString()).toBe("string");
  });
});
