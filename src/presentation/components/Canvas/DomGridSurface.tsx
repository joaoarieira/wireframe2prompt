import { useRef } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { GridSurfaceProps } from "./GridSurface";
import { cellAtPoint, isWithinGrid } from "./cellGeometry";
import type { Position } from "../../../domain/entities/position/Position";
import type { SurfacePoint } from "../../state/tools/CanvasTool";

/**
 * Hover affordance: a one-cell outline drawn by the browser's native `:hover`
 * (no JS, no re-render). `outline` rather than `border` so it never resizes the
 * cell's content box, and a -1px offset keeps it inside the cell edge instead of
 * bleeding onto neighbours.
 */
const HOVER_OUTLINE =
  "hover:outline hover:outline-1 hover:outline-base-content/50 hover:-outline-offset-1";

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
}: GridSurfaceProps) {
  const dragging = useRef(false);

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
    onCellPointerDown(cell, pointFrom(event));
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const cell = cellFrom(event);
    // Forward all moves so the paste-preview ghost tracks the cursor without
    // requiring a button press. Tool move handlers (updateDrag, updateMarquee,
    // extendStroke, updatePan) are no-ops when their respective gesture is idle.
    if (cell === null) {
      return;
    }
    onCellPointerMove(cell, pointFrom(event));
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const cell = cellFrom(event);
    if (!dragging.current || cell === null) {
      return;
    }
    dragging.current = false;
    onCellPointerUp(cell, pointFrom(event));
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
