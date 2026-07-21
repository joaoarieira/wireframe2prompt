import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { CardElement } from "../../../domain/entities/element/CardElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

export class CardGlyphMapper implements IGlyphMapper {
  readonly kind = "card";

  map(element: Element): GlyphCell[] {
    const card = element as CardElement;
    const { col: x, row: y } = card.position;
    const { width, height } = card.size;
    const style = card.borderStyle;
    const cells: GlyphCell[] = [];

    const put = (col: number, row: number, char: CellChar) => {
      cells.push({ position: Position.create(col, row), char });
    };

    const right = x + width - 1;
    const bottom = y + height - 1;

    // Corners
    put(x, y, style.topLeft);
    put(right, y, style.topRight);
    put(x, bottom, style.bottomLeft);
    put(right, bottom, style.bottomRight);

    // Top and bottom edges
    for (let col = x + 1; col < right; col++) {
      put(col, y, style.horizontal);
      put(col, bottom, style.horizontal);
    }

    // Left and right edges
    for (let row = y + 1; row < bottom; row++) {
      put(x, row, style.vertical);
      put(right, row, style.vertical);
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
      put(x, y + 2, style.teeRight);
      put(right, y + 2, style.teeLeft);
      for (let col = x + 1; col < right; col++) {
        put(col, y + 2, style.horizontal);
      }
    }

    return cells;
  }
}
