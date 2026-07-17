import { describe, expect, test } from "vitest";
import { ArrowGlyphMapper } from "./ArrowGlyphMapper";
import type { ArrowDirection } from "../../../domain/entities/element/ArrowElement";
import { ArrowElement } from "../../../domain/entities/element/ArrowElement";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new ArrowGlyphMapper()),
);

function doc(cols: number, rows: number, element: ArrowElement) {
  return WireframeDocument.create({
    id: "d",
    name: "d",
    gridSize: GridSize.create(cols, rows),
    elements: [element],
  });
}

function arrow(direction: ArrowDirection, width: number, height: number) {
  return ArrowElement.create({
    id: "a",
    position: Position.create(0, 0),
    size: Size.create(width, height),
    zIndex: 0,
    layerId: null,
    direction,
  });
}

describe("ArrowGlyphMapper (golden tests)", () => {
  test("4×1 right → --->", () => {
    expect(composer.compose(doc(4, 1, arrow("right", 4, 1))).toString()).toBe("--->");
  });

  test("4×1 left → <---", () => {
    expect(composer.compose(doc(4, 1, arrow("left", 4, 1))).toString()).toBe("<---");
  });

  test("1×3 down → |, |, v", () => {
    expect(composer.compose(doc(1, 3, arrow("down", 1, 3))).toString()).toBe("|\n|\nv");
  });

  test("1×3 up → ^, |, |", () => {
    expect(composer.compose(doc(1, 3, arrow("up", 1, 3))).toString()).toBe("^\n|\n|");
  });

  test("1×1 right → >", () => {
    expect(composer.compose(doc(1, 1, arrow("right", 1, 1))).toString()).toBe(">");
  });

  test("1×1 left → <", () => {
    expect(composer.compose(doc(1, 1, arrow("left", 1, 1))).toString()).toBe("<");
  });

  test("1×1 down → v", () => {
    expect(composer.compose(doc(1, 1, arrow("down", 1, 1))).toString()).toBe("v");
  });

  test("1×1 up → ^", () => {
    expect(composer.compose(doc(1, 1, arrow("up", 1, 1))).toString()).toBe("^");
  });
});
