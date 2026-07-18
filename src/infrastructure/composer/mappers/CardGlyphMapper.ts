import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { CardElement } from "../../../domain/entities/element/CardElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

const PLUS = CellChar.create("+");
const DASH = CellChar.create("-");
const PIPE = CellChar.create("|");

export class CardGlyphMapper implements IGlyphMapper {
  readonly kind = "card";

  map(element: Element): GlyphCell[] {
    const card = element as CardElement;
    const { col: x, row: y } = card.position;
    const { width, height } = card.size;
    const cells: GlyphCell[] = [];

    const put = (col: number, row: number, char: CellChar) => {
      cells.push({ position: Position.create(col, row), char });
    };

    const right = x + width - 1;
    const bottom = y + height - 1;

    // Corners
    put(x, y, PLUS);
    put(right, y, PLUS);
    put(x, bottom, PLUS);
    put(right, bottom, PLUS);

    // Top and bottom edges
    for (let col = x + 1; col < right; col++) {
      put(col, y, DASH);
      put(col, bottom, DASH);
    }

    // Left and right edges
    for (let row = y + 1; row < bottom; row++) {
      put(x, row, PIPE);
      put(right, row, PIPE);
    }

    // Title (at y+1, starting at x+2)
    if (card.title !== null && height >= 3) {
      const maxLen = Math.max(0, width - 4);
      const visible = card.title.slice(0, maxLen);
      for (let i = 0; i < visible.length; i++) {
        put(x + 2 + i, y + 1, CellChar.create(visible[i]));
      }
    }

    // Separator at y+2
    if (height >= 4) {
      put(x, y + 2, PLUS);
      put(right, y + 2, PLUS);
      for (let col = x + 1; col < right; col++) {
        put(col, y + 2, DASH);
      }
    }

    return cells;
  }
}
