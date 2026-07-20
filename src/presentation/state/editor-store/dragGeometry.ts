import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import type { LineOrientation } from "../../../domain/entities/element/LineElement";
import type { ArrowDirection } from "../../../domain/entities/element/ArrowElement";

/**
 * Minimum perpendicular travel (in cells) before a line flips orientation
 * during a resize/placement drag. Two cells keeps a jittery 1-cell drag from
 * accidentally rotating the line.
 */
export const LINE_FLIP_THRESHOLD = 2;

export interface CellRect {
  position: Position;
  size: Size;
}

/**
 * Inclusive rectangle spanned by two cells, in any drag direction: the
 * position is the min corner, so dragging up/left of the anchor grows the
 * rect instead of clamping it (used by placement drags and the marquee).
 *
 * @example
 * cellSpanRect(pos(5, 3), pos(2, 1)); // => { position: pos(2, 1), size 4×3 }
 */
export function cellSpanRect(
  startCell: Position,
  lastCell: Position,
): CellRect {
  const minCol = Math.min(startCell.col, lastCell.col);
  const minRow = Math.min(startCell.row, lastCell.row);
  const maxCol = Math.max(startCell.col, lastCell.col);
  const maxRow = Math.max(startCell.row, lastCell.row);
  return {
    position: Position.create(minCol, minRow),
    size: Size.create(maxCol - minCol + 1, maxRow - minRow + 1),
  };
}

/**
 * Orientation a line takes after a resize/placement gesture. A line flips when
 * the perpendicular travel reaches {@link LINE_FLIP_THRESHOLD} AND strictly
 * exceeds the parallel travel; a tie keeps the current orientation. Deltas are
 * `lastCell - startCell`, so negative deltas (up/left of the anchor) never
 * flip.
 *
 * @example
 * lineOrientationForDrag("h", 0, 3); // => "v"
 */
export function lineOrientationForDrag(
  current: LineOrientation,
  deltaCol: number,
  deltaRow: number,
): LineOrientation {
  if (current === "h") {
    return deltaRow >= LINE_FLIP_THRESHOLD && deltaRow > deltaCol ? "v" : "h";
  }
  return deltaCol >= LINE_FLIP_THRESHOLD && deltaCol > deltaRow ? "h" : "v";
}

/**
 * Collapses a drag target onto a line's canonical size: `w×1` when horizontal,
 * `1×h` when vertical (the perpendicular dimension a LineGlyphMapper ignores).
 */
export function lineSizeForOrientation(
  orientation: LineOrientation,
  target: Size,
): Size {
  return orientation === "h"
    ? Size.create(target.width, 1)
    : Size.create(1, target.height);
}

/** Axis an arrow lies on — left/right arrows behave like horizontal lines. */
export function arrowOrientationOf(direction: ArrowDirection): LineOrientation {
  return direction === "left" || direction === "right" ? "h" : "v";
}

/**
 * Arrow head direction a drag produces along the given axis: the head follows
 * the mouse, so a signed negative delta points the arrow left/up. A zero delta
 * keeps the default forward direction (right/down).
 *
 * @example
 * arrowDirectionForDrag("v", 0, -3); // => "up"
 */
export function arrowDirectionForDrag(
  orientation: LineOrientation,
  deltaCol: number,
  deltaRow: number,
): ArrowDirection {
  if (orientation === "h") {
    return deltaCol < 0 ? "left" : "right";
  }
  return deltaRow < 0 ? "up" : "down";
}
