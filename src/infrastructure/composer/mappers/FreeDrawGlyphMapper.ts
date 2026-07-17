import type { IGlyphMapper, GlyphCell } from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { FreeDrawElement } from "../../../domain/entities/element/FreeDrawElement";
import { Position } from "../../../domain/entities/position/Position";

export class FreeDrawGlyphMapper implements IGlyphMapper {
  readonly kind = "freedraw";

  map(element: Element): GlyphCell[] {
    const fd = element as FreeDrawElement;
    const { col: x, row: y } = fd.position;
    const cells: GlyphCell[] = [];

    for (const [key, char] of fd.cells) {
      const comma = key.indexOf(",");
      const relCol = Number(key.slice(0, comma));
      const relRow = Number(key.slice(comma + 1));
      cells.push({
        position: Position.create(x + relCol, y + relRow),
        char,
      });
    }

    return cells;
  }
}
