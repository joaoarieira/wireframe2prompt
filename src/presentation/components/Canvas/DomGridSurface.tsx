import { useRef } from "react";
import type { PointerEvent } from "react";
import type { GridSurfaceProps } from "./GridSurface";
import { cellAtPoint, isWithinGrid } from "./cellGeometry";
import type { Position } from "../../../domain/entities/position/Position";

/**
 * DOM implementation of the grid surface: one `<span>` per cell laid out with
 * CSS grid. Pointer events are handled at the container and mapped to cells by
 * geometry (not per-span targets) so pointer capture keeps drags working when
 * the cursor leaves the grid.
 */
export function DomGridSurface({
  buffer,
  onCellPointerDown,
  onCellPointerMove,
  onCellPointerUp,
}: GridSurfaceProps) {
  const dragging = useRef(false);

  const cellFrom = (event: PointerEvent<HTMLDivElement>): Position | null =>
    cellAtPoint(
      event.currentTarget.getBoundingClientRect(),
      buffer.width,
      buffer.height,
      event,
    );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const cell = cellFrom(event);
    if (cell === null || !isWithinGrid(cell, buffer.width, buffer.height)) {
      return;
    }
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    onCellPointerDown(cell);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const cell = cellFrom(event);
    if (!dragging.current || cell === null) {
      return;
    }
    onCellPointerMove(cell);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const cell = cellFrom(event);
    if (!dragging.current || cell === null) {
      return;
    }
    dragging.current = false;
    onCellPointerUp(cell);
  };

  const rows = buffer.toString().split("\n");

  return (
    <div
      className="grid cursor-crosshair touch-none select-none"
      style={{
        gridTemplateColumns: `repeat(${buffer.width}, var(--cell-w))`,
      }}
      data-testid="grid-surface"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {rows.map((rowChars, row) =>
        [...rowChars].map((char, col) => (
          <span
            // eslint-disable-next-line react-x/no-array-index-key -- the coordinate IS the cell's identity on a fixed grid
            key={`${col},${row}`}
            data-col={col}
            data-row={row}
            className="h-[var(--cell-h)] w-[var(--cell-w)] text-center leading-[var(--cell-h)] whitespace-pre"
          >
            {char}
          </span>
        )),
      )}
    </div>
  );
}
