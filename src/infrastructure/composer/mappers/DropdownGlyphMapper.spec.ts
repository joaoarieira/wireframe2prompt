import { describe, expect, test } from "vitest";
import { DropdownGlyphMapper } from "./DropdownGlyphMapper";
import { DropdownElement } from "../../../domain/entities/element/DropdownElement";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new DropdownGlyphMapper()),
);

function dropdown(width: number) {
  return DropdownElement.create({
    id: "d",
    position: Position.create(0, 0),
    size: Size.create(width, 4),
    zIndex: 0,
    layerId: null,
    label: "Label",
    placeholder: "Placeholder",
    hint: "Hint",
  });
}

const pad = (lines: string[], width: number) =>
  lines.map((line) => line.padEnd(width)).join("\n");

describe("DropdownGlyphMapper (golden tests)", () => {
  test("draws the ▼ indicator with the placeholder anchored to its left", () => {
    const result = composer
      .compose(
        WireframeDocument.create({
          id: "doc",
          name: "doc",
          gridSize: GridSize.create(22, 4),
          elements: [dropdown(22)],
        }),
      )
      .toString();
    expect(result).toBe(
      pad(
        [
          "+-Label--------------+",
          "|      Placeholder ▼ |",
          "+--------------------+",
          " Hint",
        ],
        22,
      ),
    );
  });
});
