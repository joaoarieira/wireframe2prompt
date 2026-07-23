import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { ButtonElement } from "../../../domain/entities/element/ButtonElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

export class ButtonGlyphMapper implements IGlyphMapper {
  readonly kind = "button";

  map(element: Element): GlyphCell[] {
    const button = element as ButtonElement;
    const { col: x, row: y } = button.position;
    const { width, height } = button.size;
    const style = button.borderStyle;
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

    // Centered label block: each line centered horizontally, the block centered
    // vertically. The box always fits the label (see ButtonElement.fitSize), so
    // every line lands inside the interior. Written last so the glyphs win any
    // cell they overlap.
    const lines = button.textLines();
    const topRow = button.textTopRow();
    for (let line = 0; line < lines.length; line++) {
      const chars = [...lines[line]];
      const start = button.textStartCol(chars.length);
      for (let i = 0; i < chars.length; i++) {
        put(start + i, topRow + line, CellChar.create(chars[i]));
      }
    }

    return cells;
  }
}
