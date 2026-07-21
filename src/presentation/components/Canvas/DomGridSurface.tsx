import { useEffect, useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { GridSurfaceProps } from "./GridSurface";
import { cellAtPoint, isWithinGrid } from "./cellGeometry";
import type { Position } from "../../../domain/entities/position/Position";
import type { SurfacePoint } from "../../state/tools/CanvasTool";
import {
  beginPress,
  movePress,
  LONG_PRESS_MS,
  type LongPress,
} from "./touchGestures";

/** Two taps on the same cell within this window count as a double-tap. */
const DOUBLE_TAP_MS = 300;

/** `SurfacePoint.button` value that opens the context menu (right-click parity). */
const SECONDARY_BUTTON = 2;

/**
 * Hover affordance: a one-cell outline drawn by the browser's native `:hover`
 * (no JS, no re-render). `outline` rather than `border` so it never resizes the
 * cell's content box, and a -1px offset keeps it inside the cell edge instead of
 * bleeding onto neighbours.
 */
// Gated behind `hover:hover` so a touch tap doesn't leave the outline stuck on
// the last cell the finger lifted from (touch has no real hover state).
const HOVER_OUTLINE =
  "[@media(hover:hover)]:hover:outline [@media(hover:hover)]:hover:outline-1 [@media(hover:hover)]:hover:outline-base-content/50 [@media(hover:hover)]:hover:-outline-offset-1";

const CELL_CLASS =
  "h-[var(--cell-h)] w-[var(--cell-w)] text-center leading-[var(--cell-h)] whitespace-pre";

/**
 * DOM implementation of the grid surface: one `<span>` per cell laid out with
 * CSS grid. Pointer events are handled at the container and mapped to cells by
 * geometry (not per-span targets) so pointer capture keeps drags working when
 * the cursor leaves the grid.
 *
 * Primary (button 0) and secondary (button 2) pointer-down events are both
 * forwarded; button 2 opens the context menu (full or paste-only) in the store.
 * Middle button (1) is left for the Canvas pan handler.
 */
export function DomGridSurface({
  buffer,
  onCellPointerDown,
  onCellPointerMove,
  onCellPointerUp,
  onCellDoubleClick,
  showHoverHighlight = true,
  suppressCellEvents = false,
}: GridSurfaceProps) {
  const dragging = useRef(false);
  // Long-press → context menu (touch right-click). The timer fires the
  // secondary-button path; `longPress` tracks drift so a scroll/drag cancels it.
  const longPress = useRef<LongPress | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);
  // Last touch tap, to synthesize a double-tap where the browser withholds a
  // native dblclick on `touch-action: none` surfaces.
  const lastTap = useRef<{ cell: Position; at: number } | null>(null);

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPress.current = null;
  };

  // A pinch (or unmount) must abandon any pending long-press so it can't pop the
  // context menu mid-gesture.
  useEffect(() => {
    if (suppressCellEvents) {
      clearLongPress();
    }
  }, [suppressCellEvents]);
  useEffect(() => () => clearLongPress(), []);

  const cellFrom = (event: PointerEvent<HTMLDivElement>): Position | null =>
    cellAtPoint(
      event.currentTarget.getBoundingClientRect(),
      buffer.width,
      buffer.height,
      event,
    );

  const pointFrom = (event: PointerEvent<HTMLDivElement>): SurfacePoint => ({
    clientX: event.clientX,
    clientY: event.clientY,
    button: event.button,
    shiftKey: event.shiftKey,
  });

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    // A second finger has turned this into a pinch — stop routing touches to
    // the active tool so the gesture only zooms/pans.
    if (suppressCellEvents) {
      return;
    }
    // Primary (0) and secondary (2) drive tools; middle (1) pans.
    if (event.button !== 0 && event.button !== 2) {
      return;
    }
    const cell = cellFrom(event);
    if (cell === null || !isWithinGrid(cell, buffer.width, buffer.height)) {
      return;
    }
    if (event.button === 2) {
      // A right-click may open the context menu during this very event: React
      // commits the menu synchronously, so by the time the native pointerdown
      // finishes bubbling to `document` the menu's outside-click listener is
      // already live and would close it instantly. The secondary press is
      // fully handled here — never let it reach document-level listeners.
      event.stopPropagation();
    }
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = pointFrom(event);
    onCellPointerDown(cell, point);
    if (event.pointerType === "touch" && event.button === 0) {
      armLongPress(cell, point);
    }
  };

  const armLongPress = (cell: Position, point: SurfacePoint) => {
    longPressFired.current = false;
    longPress.current = beginPress(
      cell,
      { x: point.clientX, y: point.clientY },
      Date.now(),
    );
    // The timer only survives to fire while the press stays valid: any
    // cancellation (drift, early release, pinch, unmount) runs clearLongPress,
    // which clears this timeout — so reaching here means the press is good.
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      // Reuse the exact right-click path: secondary button opens the menu.
      onCellPointerDown(cell, { ...point, button: SECONDARY_BUTTON });
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (suppressCellEvents) {
      return;
    }
    const cell = cellFrom(event);
    // Forward all moves so the paste-preview ghost tracks the cursor without
    // requiring a button press. Tool move handlers (updateDrag, updateMarquee,
    // extendStroke, updatePan) are no-ops when their respective gesture is idle.
    if (cell === null) {
      return;
    }
    if (longPress.current !== null) {
      longPress.current = movePress(longPress.current, {
        x: event.clientX,
        y: event.clientY,
      });
      if (longPress.current.cancelled) {
        clearLongPress();
      }
    }
    onCellPointerMove(cell, pointFrom(event));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (suppressCellEvents) {
      // The one-finger gesture was already cancelled when the pinch began; just
      // drop the local dragging flag so the next real press starts cleanly.
      dragging.current = false;
      return;
    }
    clearLongPress();
    if (longPressFired.current) {
      // The long-press already opened the context menu; swallow this up so the
      // tool gesture the down started isn't also committed.
      longPressFired.current = false;
      dragging.current = false;
      return;
    }
    const cell = cellFrom(event);
    if (!dragging.current || cell === null) {
      return;
    }
    dragging.current = false;
    onCellPointerUp(cell, pointFrom(event));
    if (event.pointerType === "touch") {
      detectDoubleTap(cell);
    }
  };

  const detectDoubleTap = (cell: Position) => {
    const now = Date.now();
    const previous = lastTap.current;
    if (
      previous !== null &&
      previous.cell.equals(cell) &&
      now - previous.at <= DOUBLE_TAP_MS
    ) {
      lastTap.current = null;
      onCellDoubleClick(cell);
      return;
    }
    lastTap.current = { cell, at: now };
  };

  const handleDoubleClick = (event: MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const cell = cellAtPoint(rect, buffer.width, buffer.height, event);
    if (cell === null || !isWithinGrid(cell, buffer.width, buffer.height)) {
      return;
    }
    onCellDoubleClick(cell);
  };

  const rows = buffer.toString().split("\n");
  // Placement tools show a full element ghost under the cursor, so the per-cell
  // outline would be redundant there.
  const cellClass = showHoverHighlight
    ? `${CELL_CLASS} ${HOVER_OUTLINE}`
    : CELL_CLASS;

  return (
    <div
      className="grid touch-none select-none"
      style={{
        gridTemplateColumns: `repeat(${buffer.width}, var(--cell-w))`,
      }}
      data-testid="grid-surface"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
    >
      {rows.map((rowChars, row) =>
        [...rowChars].map((char, col) => (
          <span
            // eslint-disable-next-line react-x/no-array-index-key -- the coordinate IS the cell's identity on a fixed grid
            key={`${col},${row}`}
            data-col={col}
            data-row={row}
            className={cellClass}
          >
            {char}
          </span>
        )),
      )}
    </div>
  );
}
