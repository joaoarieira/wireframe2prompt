import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { ModalElement } from "../../../domain/entities/element/ModalElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

const X = CellChar.create("X");

export class ModalGlyphMapper implements IGlyphMapper {
  readonly kind = "modal";

  map(element: Element): GlyphCell[] {
    const modal = element as ModalElement;
    const { col: x, row: y } = modal.position;
    const { width, height } = modal.size;
    const style = modal.borderStyle;
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

    // Title (at y+1, starting at x+2), truncated to max(0, width-6)
    if (modal.title !== null && height >= 3) {
      const maxLen = Math.max(0, width - 6);
      const visible = modal.title.slice(0, maxLen);
      for (let i = 0; i < visible.length; i++) {
        put(x + 2 + i, y + 1, CellChar.create(visible[i]));
      }
    }

    // Close button X at (x+width-3, y+1)
    if (height >= 3 && width >= 5) {
      put(x + width - 3, y + 1, X);
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
