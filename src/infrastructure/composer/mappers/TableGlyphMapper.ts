import type { IGlyphMapper, GlyphCell } from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { TableElement } from "../../../domain/entities/element/TableElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

const PLUS = CellChar.create("+");
const DASH = CellChar.create("-");
const PIPE = CellChar.create("|");

/**
 * Computes line positions for columns or rows.
 * Lines collapse gracefully when interior is too small (no throw).
 */
function computeLines(origin: number, extent: number, count: number): Set<number> {
  const interior = extent - (count + 1);
  const base = Math.max(0, Math.floor(interior / count));
  const rem = interior <= 0 ? 0 : interior % count;

  const lines = new Set<number>();
  let pos = origin;
  for (let i = 0; i <= count; i++) {
    lines.add(pos);
    const cellSize = i < rem ? base + 1 : base;
    pos += cellSize + 1;
  }
  return lines;
}

export class TableGlyphMapper implements IGlyphMapper {
  readonly kind = "table";

  map(element: Element): GlyphCell[] {
    const table = element as TableElement;
    const { col: x, row: y } = table.position;
    const { width, height } = table.size;
    const cells: GlyphCell[] = [];

    const colLines = computeLines(x, width, table.columns);
    const rowLines = computeLines(y, height, table.rows);

    for (let col = x; col < x + width; col++) {
      for (let row = y; row < y + height; row++) {
        const isCol = colLines.has(col);
        const isRow = rowLines.has(row);
        if (isCol && isRow) {
          cells.push({ position: Position.create(col, row), char: PLUS });
        } else if (isRow) {
          cells.push({ position: Position.create(col, row), char: DASH });
        } else if (isCol) {
          cells.push({ position: Position.create(col, row), char: PIPE });
        }
      }
    }

    return cells;
  }
}
