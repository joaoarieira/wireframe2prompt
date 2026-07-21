/** A pointer position in client (screen) coordinates. */
export interface PinchPoint {
  x: number;
  y: number;
}

/** The change between two two-finger samples of a pinch gesture. */
export interface PinchDelta {
  /** Ratio of the new finger distance to the old one (1 = unchanged). */
  scaleFactor: number;
  /** Midpoint of the current finger pair, the zoom anchor. */
  midpoint: PinchPoint;
  /** How far the midpoint moved since the previous sample (the pan). */
  midpointDelta: PinchPoint;
}

function distance(a: PinchPoint, b: PinchPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpointOf(a: PinchPoint, b: PinchPoint): PinchPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

/**
 * Computes the zoom/pan delta between two samples of a two-finger gesture. A
 * degenerate previous pair (distance 0) yields `scaleFactor` 1 so a division by
 * zero never scales the viewport to NaN.
 *
 * @example
 * pinchDelta([{x:0,y:0},{x:10,y:0}], [{x:0,y:0},{x:20,y:0}]).scaleFactor // 2
 */
export function pinchDelta(
  previous: readonly [PinchPoint, PinchPoint],
  current: readonly [PinchPoint, PinchPoint],
): PinchDelta {
  const previousDistance = distance(previous[0], previous[1]);
  const currentDistance = distance(current[0], current[1]);
  const scaleFactor =
    previousDistance === 0 ? 1 : currentDistance / previousDistance;
  const previousMidpoint = midpointOf(previous[0], previous[1]);
  const midpoint = midpointOf(current[0], current[1]);
  return {
    scaleFactor,
    midpoint,
    midpointDelta: {
      x: midpoint.x - previousMidpoint.x,
      y: midpoint.y - previousMidpoint.y,
    },
  };
}
