import type { GlyphCell } from "../../../domain/ports/IGlyphMapper";
import type { FieldElement } from "../../../domain/entities/element/FieldElement";
import { Position } from "../../../domain/entities/position/Position";
import { CellChar } from "../../../domain/entities/cell-char/CellChar";

const ARROW = CellChar.create("▼");

/**
 * Rasterizes a field element (input/dropdown). Shared by both mappers since the
 * only difference is the dropdown's `▼`, which the element declares via
 * {@link FieldElement.showsArrow}.
 *
 * Layout for a W-wide box at (x, y):
 * - row y   : `┌─<label>─…─┐`  (label left-anchored, truncated to fit)
 * - row y+1 : `│ … <placeholder> [▼ ]│`  (placeholder right-anchored, prefix kept)
 * - row y+2 : `└───…───┘`
 * - row y+3…: the hint, left-anchored and wrapped one grid line per {@link FieldElement.hintLines}.
 */
export function mapFieldElement(field: FieldElement): GlyphCell[] {
  const { col: x, row: y } = field.position;
  const width = field.size.width;
  const right = x + width - 1;
  const style = field.borderStyle;
  const cells: GlyphCell[] = [];
  const put = (col: number, row: number, char: CellChar) => {
    cells.push({ position: Position.create(col, row), char });
  };

  putBorderRow(
    put,
    x,
    right,
    y,
    style.topLeft,
    style.topRight,
    style.horizontal,
  );
  putBorderRow(
    put,
    x,
    right,
    y + 2,
    style.bottomLeft,
    style.bottomRight,
    style.horizontal,
  );
  putLabel(put, field, x, y);
  putFieldRow(put, field, x, right, y + 1, style.vertical);
  putHint(put, field, x, y);

  return cells;
}

type Put = (col: number, row: number, char: CellChar) => void;

/** A `┌───┐`/`└───┘` border row spanning the box width, given its corners/edge. */
function putBorderRow(
  put: Put,
  x: number,
  right: number,
  row: number,
  leftCorner: CellChar,
  rightCorner: CellChar,
  horizontal: CellChar,
): void {
  put(x, row, leftCorner);
  put(right, row, rightCorner);
  for (let col = x + 1; col < right; col++) {
    put(col, row, horizontal);
  }
}

/** Label glyphs, starting one dash in from the top-left corner. */
function putLabel(put: Put, field: FieldElement, x: number, y: number): void {
  const region = field.labelRegion();
  const text = (field.label ?? "").slice(0, region.size.width);
  const chars = [...text];
  for (let i = 0; i < chars.length; i++) {
    put(x + 2 + i, y, CellChar.create(chars[i]));
  }
}

/** The `| … placeholder ▼ |` row: side pipes, right-anchored placeholder, arrow. */
function putFieldRow(
  put: Put,
  field: FieldElement,
  x: number,
  right: number,
  row: number,
  vertical: CellChar,
): void {
  put(x, row, vertical);
  put(right, row, vertical);
  const region = field.placeholderRegion();
  const text = [...(field.placeholder ?? "").slice(0, region.size.width)];
  const rightEdge = region.position.col + region.size.width - 1;
  const start = rightEdge - text.length + 1;
  for (let i = 0; i < text.length; i++) {
    put(start + i, row, CellChar.create(text[i]));
  }
  if (field.showsArrow) {
    put(right - 2, row, ARROW);
  }
}

/** The wrapped hint lines below the box, left-anchored. */
function putHint(put: Put, field: FieldElement, x: number, y: number): void {
  const lines = field.hintLines();
  for (let r = 0; r < lines.length; r++) {
    const chars = [...lines[r]];
    for (let i = 0; i < chars.length; i++) {
      put(x + 1 + i, y + 3 + r, CellChar.create(chars[i]));
    }
  }
}
