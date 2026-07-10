import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { CellChar } from "../../../domain/entities/cell-char/CellChar";
import type { Element } from "../../../domain/entities/element/Element";
import { BoxElement } from "../../../domain/entities/element/BoxElement";
import { Position } from "../../../domain/entities/position/Position";

export class BoxGlyphMapper implements IGlyphMapper {
  readonly kind = "box";

  map(element: Element): GlyphCell[] {
    const box = element as BoxElement;
    const { col: x, row: y } = box.position;
    const { width, height } = box.size;
    const style = box.borderStyle;

    const cells: GlyphCell[] = [];
    const put = (col: number, row: number, char: CellChar) => {
      cells.push({ position: Position.create(col, row), char });
    };

    const right = x + width - 1;
    const bottom = y + height - 1;

    put(x, y, style.topLeft);
    put(right, y, style.topRight);
    put(x, bottom, style.bottomLeft);
    put(right, bottom, style.bottomRight);

    for (let col = x + 1; col < right; col++) {
      put(col, y, style.horizontal);
      put(col, bottom, style.horizontal);
    }

    for (let row = y + 1; row < bottom; row++) {
      put(x, row, style.vertical);
      put(right, row, style.vertical);
    }

    return cells;
  }
}
