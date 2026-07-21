import type { Position } from "../../../domain/entities/position/Position";

/** A pointer position in client (screen) pixels. */
export interface PressPoint {
  x: number;
  y: number;
}

/** In-flight long-press candidate: the down cell plus where/when it started. */
export interface LongPress {
  cell: Position;
  origin: PressPoint;
  startedAt: number;
  /** Set once the finger drifts too far — the press can no longer fire. */
  cancelled: boolean;
}

/** How long a finger must rest before a long-press fires (right-click parity). */
export const LONG_PRESS_MS = 500;

/** A finger drifting past this (about one cell) cancels the long-press. */
export const LONG_PRESS_MOVE_TOLERANCE_PX = 10;

/**
 * Starts tracking a long-press at the pressed cell.
 *
 * @example const press = beginPress(cell, { x: 12, y: 30 }, performance.now());
 */
export function beginPress(
  cell: Position,
  origin: PressPoint,
  startedAt: number,
): LongPress {
  return { cell, origin, startedAt, cancelled: false };
}

/**
 * Feeds a move into the tracker: a drift beyond
 * {@link LONG_PRESS_MOVE_TOLERANCE_PX} from the origin cancels the press. Once
 * cancelled it stays cancelled.
 */
export function movePress(press: LongPress, point: PressPoint): LongPress {
  if (press.cancelled) {
    return press;
  }
  const drift = Math.hypot(point.x - press.origin.x, point.y - press.origin.y);
  if (drift > LONG_PRESS_MOVE_TOLERANCE_PX) {
    return { ...press, cancelled: true };
  }
  return press;
}

/**
 * Whether the press has rested long enough to fire — true only when it wasn't
 * cancelled and at least {@link LONG_PRESS_MS} has elapsed since it began.
 */
export function pressElapsed(press: LongPress, now: number): boolean {
  return !press.cancelled && now - press.startedAt >= LONG_PRESS_MS;
}
