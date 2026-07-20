import { Position } from "../../../domain/entities/position/Position";
import { Size } from "../../../domain/entities/size/Size";
import type { LineOrientation } from "../../../domain/entities/element/LineElement";

/**
 * Minimum perpendicular travel (in cells) before a line flips orientation
 * during a resize/placement drag. Two cells keeps a jittery 1-cell drag from
 * accidentally rotating the line.
 */
export const LINE_FLIP_THRESHOLD = 2;

/**
 * Inclusive bounding box anchored at `startCell`. Dragging up/left of the
 * anchor never repositions it — the size just clamps at 1, mirroring the
 * single bottom-right resize handle.
 *
 * @example
 * placementDragSize(pos(0, 0), pos(4, 4)); // => Size 5×5
 */
export function placementDragSize(
  startCell: Position,
  lastCell: Position,
): Size {
  return Size.create(
    Math.max(1, lastCell.col - startCell.col + 1),
    Math.max(1, lastCell.row - startCell.row + 1),
  );
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
