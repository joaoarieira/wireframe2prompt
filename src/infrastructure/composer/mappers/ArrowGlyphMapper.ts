import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { ArrowElement } from "../../../domain/entities/element/ArrowElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";
import { BorderStyle } from "../../../domain/value-objects/border-style/BorderStyle";

// Arrow shafts are always unicode strokes, independent of any border style.
const { horizontal: DASH, vertical: PIPE } = BorderStyle.square();

const HEAD_RIGHT = CellChar.create("→");
const HEAD_LEFT = CellChar.create("←");
const HEAD_DOWN = CellChar.create("↓");
const HEAD_UP = CellChar.create("↑");

export class ArrowGlyphMapper implements IGlyphMapper {
  readonly kind = "arrow";

  map(element: Element): GlyphCell[] {
    const arrow = element as ArrowElement;
    const { col: x, row: y } = arrow.position;
    const { width, height } = arrow.size;
    const cells: GlyphCell[] = [];

    const put = (col: number, row: number, char: CellChar) => {
      cells.push({ position: Position.create(col, row), char });
    };

    if (arrow.direction === "right") {
      for (let i = 0; i < width - 1; i++) put(x + i, y, DASH);
      put(x + width - 1, y, HEAD_RIGHT);
    } else if (arrow.direction === "left") {
      put(x, y, HEAD_LEFT);
      for (let i = 1; i < width; i++) put(x + i, y, DASH);
    } else if (arrow.direction === "down") {
      for (let i = 0; i < height - 1; i++) put(x, y + i, PIPE);
      put(x, y + height - 1, HEAD_DOWN);
    } else {
      put(x, y, HEAD_UP);
      for (let i = 1; i < height; i++) put(x, y + i, PIPE);
    }

    return cells;
  }
}
