import { describe, expect, test } from "vitest";
import { CardGlyphMapper } from "./CardGlyphMapper";
import { CardElement } from "../../../domain/entities/element/CardElement";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new CardGlyphMapper()),
);

function doc(cols: number, rows: number, element: CardElement) {
  return WireframeDocument.create({
    id: "d",
    name: "d",
    gridSize: GridSize.create(cols, rows),
    elements: [element],
  });
}

function card(width: number, height: number, title: string | null) {
  return CardElement.create({
    id: "c",
    position: Position.create(0, 0),
    size: Size.create(width, height),
    zIndex: 0,
    layerId: null,
    title,
  });
}

describe("CardGlyphMapper (golden tests)", () => {
  test("10×6 with title 'Card'", () => {
    const result = composer.compose(doc(10, 6, card(10, 6, "Card")));
    expect(result.toString()).toBe(
      [
        "+--------+",
        "| Card   |",
        "+--------+",
        "|        |",
        "|        |",
        "+--------+",
      ].join("\n"),
    );
  });

  test("6×5 with title 'Longtitle' (truncated to 2 chars)", () => {
    const result = composer.compose(doc(6, 5, card(6, 5, "Longtitle")));
    expect(result.toString()).toBe(
      [
        "+----+",
        "| Lo |",
        "+----+",
        "|    |",
        "+----+",
      ].join("\n"),
    );
  });

  test("null title → plain box", () => {
    const result = composer.compose(doc(6, 4, card(6, 4, null)));
    expect(result.toString()).toBe(
      [
        "+----+",
        "|    |",
        "+----+",
        "+----+",
      ].join("\n"),
    );
  });

  test("height < 3 → no title or separator", () => {
    const result = composer.compose(doc(6, 2, card(6, 2, "Title")));
    expect(result.toString()).toBe(["+----+", "+----+"].join("\n"));
  });

  test("height == 3 → title but no separator", () => {
    const result = composer.compose(doc(8, 3, card(8, 3, "Hi")));
    expect(result.toString()).toBe(["+------+", "| Hi   |", "+------+"].join("\n"));
  });
});
