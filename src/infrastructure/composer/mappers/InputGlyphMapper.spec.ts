import { describe, expect, test } from "vitest";
import { InputGlyphMapper } from "./InputGlyphMapper";
import { InputElement } from "../../../domain/entities/element/InputElement";
import { GlyphMapperRegistry } from "../GlyphMapperRegistry";
import { ZIndexComposer } from "../ZIndexComposer";
import { WireframeDocument } from "../../../domain/aggregates/wireframe-document/WireframeDocument";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";
import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";

const composer = new ZIndexComposer(
  new GlyphMapperRegistry().register(new InputGlyphMapper()),
);

function input(
  width: number,
  label: string | null,
  placeholder: string | null,
  hint: string | null,
) {
  return InputElement.create({
    id: "i",
    position: Position.create(0, 0),
    size: Size.create(width, 4),
    zIndex: 0,
    layerId: null,
    label,
    placeholder,
    hint,
  });
}

function render(width: number, rows: number, element: InputElement) {
  return composer
    .compose(
      WireframeDocument.create({
        id: "d",
        name: "d",
        gridSize: GridSize.create(width, rows),
        elements: [element],
      }),
    )
    .toString();
}

const pad = (lines: string[], width: number) =>
  lines.map((line) => line.padEnd(width)).join("\n");

describe("InputGlyphMapper (golden tests)", () => {
  test("label left-anchored, placeholder right-anchored, hint below", () => {
    const result = render(22, 4, input(22, "Label", "Placeholder", "Hint"));
    expect(result).toBe(
      pad(
        [
          "┌─Label──────────────┐",
          "│        Placeholder │",
          "└────────────────────┘",
          " Hint",
        ],
        22,
      ),
    );
  });

  test("over-long text is truncated and the hint wraps", () => {
    const alphabet = "Abcdefghijklmnopqrstuvwxyz";
    const result = render(22, 5, input(22, alphabet, alphabet, alphabet));
    expect(result).toBe(
      pad(
        [
          "┌─Abcdefghijklmnopqr─┐",
          "│ Abcdefghijklmnopqr │",
          "└────────────────────┘",
          " Abcdefghijklmnopqrst",
          " uvwxyz",
        ],
        22,
      ),
    );
  });

  test("null slots render just the empty box", () => {
    const result = render(22, 4, input(22, null, null, null));
    expect(result).toBe(
      pad(
        [
          "┌────────────────────┐",
          "│                    │",
          "└────────────────────┘",
          "",
        ],
        22,
      ),
    );
  });

  test("degenerate tiny width does not throw", () => {
    expect(() => render(2, 4, input(2, "L", "P", "H"))).not.toThrow();
  });
});
