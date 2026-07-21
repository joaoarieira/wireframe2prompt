import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { pinchDelta, type PinchPoint } from "./pinchGesture";

export interface UsePinchZoomPanParams {
  /** Element the touch listeners attach to (the whole canvas area). */
  outerRef: RefObject<HTMLElement | null>;
  /** Element whose rect anchors the zoom (the paper), like the wheel handler. */
  anchorRectRef: RefObject<HTMLElement | null>;
  /** Current viewport zoom, read fresh on every gesture sample. */
  getZoom(): number;
  /** Store action: zoom to `zoom`, anchored at the given unscaled canvas point. */
  zoomAtPoint(zoom: number, anchorX: number, anchorY: number): void;
  /** Store action: pan the viewport by a screen-pixel delta. */
  panViewportBy(deltaX: number, deltaY: number): void;
  /**
   * Cancels any in-flight one-finger tool gesture (drag/stroke/marquee) so it
   * isn't committed when the second finger turns the gesture into a pinch.
   */
  cancelGestures(): void;
}

/** Two active touch points define a pinch; fewer ends it. */
const PINCH_POINTERS = 2;

/**
 * Two-finger pinch-zoom and pan for the canvas. Tracks live touch pointers in a
 * ref (so a store-driven re-render mid-gesture doesn't drop them) and, while two
 * are down, maps each move to `zoomAtPoint` + `panViewportBy`. Returns
 * `isPinching` so the Canvas can suppress per-cell events for the fingers taking
 * part. Mouse/pen pointers are ignored — those keep the wheel/drag paths.
 *
 * @example const { isPinching } = usePinchZoomPan({ outerRef, anchorRectRef, ... });
 */
export function usePinchZoomPan({
  outerRef,
  anchorRectRef,
  getZoom,
  zoomAtPoint,
  panViewportBy,
  cancelGestures,
}: UsePinchZoomPanParams): { isPinching: boolean } {
  const [isPinching, setIsPinching] = useState(false);
  const pointers = useRef(new Map<number, PinchPoint>());
  const previousPair = useRef<[PinchPoint, PinchPoint] | null>(null);

  useEffect(() => {
    const el = outerRef.current;
    if (el === null) {
      return;
    }

    const activePair = (): [PinchPoint, PinchPoint] | null => {
      const points = [...pointers.current.values()];
      return points.length >= PINCH_POINTERS ? [points[0], points[1]] : null;
    };

    const handleDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      const pair = activePair();
      if (pair !== null && previousPair.current === null) {
        cancelGestures();
        previousPair.current = pair;
        setIsPinching(true);
      }
    };

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      if (!pointers.current.has(event.pointerId)) return;
      pointers.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });
      const pair = activePair();
      if (pair === null || previousPair.current === null) return;
      applyPinch(previousPair.current, pair);
      previousPair.current = pair;
    };

    const applyPinch = (
      previous: [PinchPoint, PinchPoint],
      current: [PinchPoint, PinchPoint],
    ) => {
      const rect = anchorRectRef.current?.getBoundingClientRect();
      if (rect === undefined) return;
      const { scaleFactor, midpoint, midpointDelta } = pinchDelta(
        previous,
        current,
      );
      const zoom = getZoom();
      const anchorX = (midpoint.x - rect.left) / zoom;
      const anchorY = (midpoint.y - rect.top) / zoom;
      zoomAtPoint(zoom * scaleFactor, anchorX, anchorY);
      panViewportBy(midpointDelta.x, midpointDelta.y);
    };

    const handleUp = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      if (!pointers.current.delete(event.pointerId)) return;
      if (pointers.current.size < PINCH_POINTERS) {
        previousPair.current = null;
        setIsPinching(false);
      }
    };

    el.addEventListener("pointerdown", handleDown);
    el.addEventListener("pointermove", handleMove);
    el.addEventListener("pointerup", handleUp);
    el.addEventListener("pointercancel", handleUp);
    return () => {
      el.removeEventListener("pointerdown", handleDown);
      el.removeEventListener("pointermove", handleMove);
      el.removeEventListener("pointerup", handleUp);
      el.removeEventListener("pointercancel", handleUp);
    };
  }, [
    outerRef,
    anchorRectRef,
    getZoom,
    zoomAtPoint,
    panViewportBy,
    cancelGestures,
  ]);

  return { isPinching };
}
