import { describe, expect, test } from "vitest";
import { TabsGlyphMapper } from "./TabsGlyphMapper";
import { TabsElement } from "../../../domain/entities/element/TabsElement";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new TabsGlyphMapper()),
);

function doc(cols: number, rows: number, element: TabsElement) {
  return WireframeDocument.create({
    id: "d",
    name: "d",
    gridSize: GridSize.create(cols, rows),
    elements: [element],
  });
}

function tabs(
  width: number,
  height: number,
  tabLabels: string[],
  active: number,
) {
  return TabsElement.create({
    id: "t",
    position: Position.create(0, 0),
    size: Size.create(width, height),
    zIndex: 0,
    layerId: null,
    tabs: tabLabels,
    active,
  });
}

describe("TabsGlyphMapper (golden tests)", () => {
  test("['One','Two'], active 1, 11×2", () => {
    const result = composer.compose(doc(11, 2, tabs(11, 2, ["One", "Two"], 1)));
    expect(result.toString()).toBe([" One |[Two]", "-----------"].join("\n"));
  });

  test("['One','Two'], active 0, 4×2 (truncation)", () => {
    const result = composer.compose(doc(4, 2, tabs(4, 2, ["One", "Two"], 0)));
    expect(result.toString()).toBe(["[One", "----"].join("\n"));
  });

  test("single tab active, height 1", () => {
    const result = composer.compose(doc(5, 1, tabs(5, 1, ["Tab"], 0)));
    expect(result.toString()).toBe("[Tab]");
  });
});
