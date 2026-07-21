import type {
  IGlyphMapper,
  GlyphCell,
} from "../../../domain/ports/IGlyphMapper";
import type { Element } from "../../../domain/entities/element/Element";
import { TableElement } from "../../../domain/entities/element/TableElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";
import { BorderStyle } from "../../../domain/value-objects/border-style/BorderStyle";

interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/**
 * Picks the border glyph for an intersection: corners for the four outer
 * angles, tees along each edge, and a cross in the interior — all taken from
 * the element's border style so square/rounded/cross render consistently.
 */
function intersectionGlyph(
  col: number,
  row: number,
  b: Bounds,
  style: BorderStyle,
): CellChar {
  const atLeft = col === b.left;
  const atRight = col === b.right;
  const atTop = row === b.top;
  const atBottom = row === b.bottom;
  if (atTop && atLeft) return style.topLeft;
  if (atTop && atRight) return style.topRight;
  if (atBottom && atLeft) return style.bottomLeft;
  if (atBottom && atRight) return style.bottomRight;
  if (atTop) return style.teeDown;
  if (atBottom) return style.teeUp;
  if (atLeft) return style.teeRight;
  if (atRight) return style.teeLeft;
  return style.cross;
}

/**
 * Computes line positions for columns or rows.
 * Lines collapse gracefully when interior is too small (no throw).
 */
function computeLines(
  origin: number,
  extent: number,
  count: number,
): Set<number> {
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
    const style = table.borderStyle;
    const cells: GlyphCell[] = [];

    const colLines = computeLines(x, width, table.columns);
    const rowLines = computeLines(y, height, table.rows);
    const bounds: Bounds = {
      left: x,
      right: x + width - 1,
      top: y,
      bottom: y + height - 1,
    };

    for (let col = x; col < x + width; col++) {
      for (let row = y; row < y + height; row++) {
        const isCol = colLines.has(col);
        const isRow = rowLines.has(row);
        if (isCol && isRow) {
          const char = intersectionGlyph(col, row, bounds, style);
          cells.push({ position: Position.create(col, row), char });
        } else if (isRow) {
          cells.push({
            position: Position.create(col, row),
            char: style.horizontal,
          });
        } else if (isCol) {
          cells.push({
            position: Position.create(col, row),
            char: style.vertical,
          });
        }
      }
    }

    return cells;
  }
}
