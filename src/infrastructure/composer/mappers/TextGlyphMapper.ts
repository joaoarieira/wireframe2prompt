import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { TextElement } from "../../../domain/entities/element/TextElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

export class TextGlyphMapper implements IGlyphMapper {
  readonly kind = "text";

  map(element: Element): GlyphCell[] {
    const text = element as TextElement;
    const { col: x, row: y } = text.position;
    const cells: GlyphCell[] = [];

    const chars = [...text.text];
    for (let i = 0; i < chars.length; i++) {
      cells.push({
        position: Position.create(x + i, y),
        char: CellChar.create(chars[i]),
      });
    }

    return cells;
  }
}
