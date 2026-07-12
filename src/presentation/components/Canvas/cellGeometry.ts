import { Position } from "../../../domain/entities/position/Position";
import { GridSize } from "../../../domain/entities/grid-size/GridSize";

/** The subset of DOMRect the cell math needs (kept narrow for tests). */
export interface RectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PointLike {
  clientX: number;
  clientY: number;
}

/**
 * Maps a viewport point to the grid cell under it, using the rendered rect so
 * the math survives CSS zoom/pan transforms. Cells outside the grid are
 * returned as-is (negative or past the edge) — dragging out and back is
 * allowed; use {@link isWithinGrid} when only inside cells are valid.
 * Returns null for a degenerate rect (e.g. an unmounted or zero-sized grid).
 *
 * @example
 * const cell = cellAtPoint(grid.getBoundingClientRect(), 80, 24, event);
 */
export function cellAtPoint(
  rect: RectLike,
  cols: number,
  rows: number,
  point: PointLike,
): Position | null {
  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }
  const col = Math.floor(((point.clientX - rect.left) / rect.width) * cols);
  const row = Math.floor(((point.clientY - rect.top) / rect.height) * rows);
  return Position.create(col, row);
}

export function isWithinGrid(
  cell: Position,
  cols: number,
  rows: number,
): boolean {
  return GridSize.create(cols, rows).contains(cell);
}
