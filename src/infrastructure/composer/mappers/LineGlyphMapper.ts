import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { LineElement } from "../../../domain/entities/element/LineElement";
import { Position } from "../../../domain/entities/position/Position";
import { HORIZONTAL, VERTICAL } from "./boxDrawing";

export class LineGlyphMapper implements IGlyphMapper {
  readonly kind = "line";

  map(element: Element): GlyphCell[] {
    const line = element as LineElement;
    const { col: x, row: y } = line.position;
    const cells: GlyphCell[] = [];

    if (line.orientation === "h") {
      for (let i = 0; i < line.size.width; i++) {
        cells.push({ position: Position.create(x + i, y), char: HORIZONTAL });
      }
    } else {
      for (let i = 0; i < line.size.height; i++) {
        cells.push({ position: Position.create(x, y + i), char: VERTICAL });
      }
    }

    return cells;
  }
}
