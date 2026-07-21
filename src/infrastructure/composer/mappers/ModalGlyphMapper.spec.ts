import { describe, expect, test } from "vitest";
import { ModalGlyphMapper } from "./ModalGlyphMapper";
import { ModalElement } from "../../../domain/entities/element/ModalElement";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new ModalGlyphMapper()),
);

function doc(cols: number, rows: number, element: ModalElement) {
  return WireframeDocument.create({
    id: "d",
    name: "d",
    gridSize: GridSize.create(cols, rows),
    elements: [element],
  });
}

function modal(width: number, height: number, title: string | null) {
  return ModalElement.create({
    id: "m",
    position: Position.create(0, 0),
    size: Size.create(width, height),
    zIndex: 0,
    layerId: null,
    title,
  });
}

describe("ModalGlyphMapper (golden tests)", () => {
  test("12×5 with title 'Hi'", () => {
    const result = composer.compose(doc(12, 5, modal(12, 5, "Hi")));
    expect(result.toString()).toBe(
      [
        "┌──────────┐",
        "│ Hi     X │",
        "├──────────┤",
        "│          │",
        "└──────────┘",
      ].join("\n"),
    );
  });

  test("12×5 with null title → close button still shown", () => {
    const result = composer.compose(doc(12, 5, modal(12, 5, null)));
    expect(result.toString()).toBe(
      [
        "┌──────────┐",
        "│        X │",
        "├──────────┤",
        "│          │",
        "└──────────┘",
      ].join("\n"),
    );
  });

  test("height < 3 → no close button or separator", () => {
    const result = composer.compose(doc(8, 2, modal(8, 2, "Hi")));
    expect(result.toString()).toBe(["┌──────┐", "└──────┘"].join("\n"));
  });

  test("width < 5 → no close button", () => {
    const result = composer.compose(doc(4, 4, modal(4, 4, "Hi")));
    expect(result.toString()).toBe(["┌──┐", "│  │", "├──┤", "└──┘"].join("\n"));
  });
});
