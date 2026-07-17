import { describe, expect, test } from "vitest";
import { FreeDrawGlyphMapper } from "./FreeDrawGlyphMapper";
import { FreeDrawElement, freeDrawCellKey } from "../../../domain/entities/element/FreeDrawElement";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new FreeDrawGlyphMapper()),
);

describe("FreeDrawGlyphMapper (golden tests)", () => {
  test("cells {'0,0':'a','2,1':'b'} at position (1,1), grid 4×3", () => {
    const element = FreeDrawElement.create({
      id: "fd",
      position: Position.create(1, 1),
      zIndex: 0,
      layerId: null,
      cells: new Map([
        [freeDrawCellKey(0, 0), CellChar.create("a")],
        [freeDrawCellKey(2, 1), CellChar.create("b")],
      ]),
    });
    const doc = WireframeDocument.create({
      id: "d",
      name: "d",
      gridSize: GridSize.create(4, 3),
      elements: [element],
    });
    expect(composer.compose(doc).toString()).toBe(
      ["    ", " a  ", "   b"].join("\n"),
    );
  });

  test("empty cells → no glyphs emitted (all spaces)", () => {
    const element = FreeDrawElement.create({
      id: "fd",
      position: Position.create(0, 0),
      zIndex: 0,
      layerId: null,
      cells: new Map(),
    });
    const doc = WireframeDocument.create({
      id: "d",
      name: "d",
      gridSize: GridSize.create(3, 2),
      elements: [element],
    });
    expect(composer.compose(doc).toString()).toBe("   \n   ");
  });
});
