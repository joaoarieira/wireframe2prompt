import { Position } from "../../../domain/entities/position/Position";

/** The axis a polyline segment runs along. */
export type PathAxis = "h" | "v";

/**
 * How far off-axis the pointer may stray before the segment bends. At 1 cell a
 * single-cell wobble is absorbed, so a mostly-straight drag stays a straight
 * line; the pointer must travel 2+ cells sideways to start a new segment.
 */
const BEND_TOLERANCE = 1;

/** Axis of the segment between two axis-aligned vertices. */
function segmentAxis(a: Position, b: Position): PathAxis {
  return a.row === b.row ? "h" : "v";
}

/** Whichever axis the pointer travelled farther along; ties go horizontal. */
function dominantAxis(from: Position, to: Position): PathAxis {
  return Math.abs(to.col - from.col) >= Math.abs(to.row - from.row) ? "h" : "v";
}

function replaceTip(points: readonly Position[], tip: Position): Position[] {
  const next = [...points];
  next[next.length - 1] = tip;
  return next;
}

/**
 * Grows an orthogonal polyline toward the cell now under the pointer, tracing
 * the connected segments a single drag draws. The last point is the live tip:
 *
 * - moving along the current segment's axis just slides the tip;
 * - moving off that axis by more than {@link BEND_TOLERANCE} cells fixes a
 *   corner at the tip and starts a perpendicular segment toward the cell;
 * - reversing exactly back onto the previous vertex collapses the segment.
 *
 * Pure, so the whole gesture reduces without DOM events.
 *
 * @example
 * // rightward then downward drag → an L-shaped 3-vertex path
 * extendMultilinePath([p(0, 0)], p(4, 0)); // [p(0,0), p(4,0)]
 */
export function extendMultilinePath(
  points: readonly Position[],
  cell: Position,
): readonly Position[] {
  const tip = points[points.length - 1];
  if (cell.equals(tip)) {
    return points;
  }
  const prev = points.length >= 2 ? points[points.length - 2] : null;
  const axis: PathAxis =
    prev === null ? dominantAxis(tip, cell) : segmentAxis(prev, tip);

  const alignedTip =
    axis === "h"
      ? Position.create(cell.col, tip.row)
      : Position.create(tip.col, cell.row);
  const perpendicular =
    axis === "h" ? cell.row - alignedTip.row : cell.col - alignedTip.col;
  const perpendicularRemains = Math.abs(perpendicular) > BEND_TOLERANCE;

  // A pure reversal that lands back on the previous vertex erases the segment.
  if (prev !== null && !perpendicularRemains && alignedTip.equals(prev)) {
    return points.slice(0, -1);
  }

  const base =
    prev === null ? [...points, alignedTip] : replaceTip(points, alignedTip);
  return perpendicularRemains ? [...base, cell] : base;
}
