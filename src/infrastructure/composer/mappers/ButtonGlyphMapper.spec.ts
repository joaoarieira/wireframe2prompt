import { describe, expect, test } from "vitest";
import { ButtonGlyphMapper } from "./ButtonGlyphMapper";
import { ButtonElement } from "../../../domain/entities/element/ButtonElement";
import { BorderStyle } from "../../../domain/value-objects/border-style/BorderStyle";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new ButtonGlyphMapper()),
);

function doc(cols: number, rows: number, element: ButtonElement) {
  return WireframeDocument.create({
    id: "d",
    name: "d",
    gridSize: GridSize.create(cols, rows),
    elements: [element],
  });
}

function button(
  width: number,
  height: number,
  text: string,
  borderStyle?: BorderStyle,
) {
  return ButtonElement.create({
    id: "b",
    position: Position.create(0, 0),
    size: Size.create(width, height),
    zIndex: 0,
    layerId: null,
    text,
    borderStyle,
  });
}

describe("ButtonGlyphMapper (golden tests)", () => {
  test("default 8×3 'Text' is a bordered box with a centered label", () => {
    const result = composer.compose(doc(8, 3, button(8, 3, "Text")));
    expect(result.toString()).toBe(
      ["┌──────┐", "│ Text │", "└──────┘"].join("\n"),
    );
  });

  test("wider box keeps the label centered", () => {
    const result = composer.compose(doc(10, 3, button(10, 3, "Text")));
    expect(result.toString()).toBe(
      ["┌────────┐", "│  Text  │", "└────────┘"].join("\n"),
    );
  });

  test("taller box vertically centers the label", () => {
    const result = composer.compose(doc(8, 5, button(8, 5, "Text")));
    expect(result.toString()).toBe(
      ["┌──────┐", "│      │", "│ Text │", "│      │", "└──────┘"].join("\n"),
    );
  });

  test("a label wider than the box grows the box to the right to fit", () => {
    // create() fits the size to the label, so "Very long" (9) → 11 wide.
    const grown = button(8, 3, "Very long");
    expect(grown.size.width).toBe(11);
    const result = composer.compose(doc(11, 3, grown));
    expect(result.toString()).toBe(
      ["┌─────────┐", "│Very long│", "└─────────┘"].join("\n"),
    );
  });

  test("a multi-line label grows the box downward and centers each line", () => {
    const grown = button(8, 3, "Hi\nBye");
    // widest "Bye" = 3, 2 lines → box grows to 8×4.
    expect(grown.size.width).toBe(8);
    expect(grown.size.height).toBe(4);
    const result = composer.compose(doc(8, 4, grown));
    expect(result.toString()).toBe(
      ["┌──────┐", "│  Hi  │", "│ Bye  │", "└──────┘"].join("\n"),
    );
  });

  test("empty text draws a plain box", () => {
    const result = composer.compose(doc(8, 3, button(8, 3, "")));
    expect(result.toString()).toBe(
      ["┌──────┐", "│      │", "└──────┘"].join("\n"),
    );
  });

  test("cross border style uses ASCII glyphs", () => {
    const result = composer.compose(
      doc(8, 3, button(8, 3, "Text", BorderStyle.cross())),
    );
    expect(result.toString()).toBe(
      ["+------+", "| Text |", "+------+"].join("\n"),
    );
  });
});
