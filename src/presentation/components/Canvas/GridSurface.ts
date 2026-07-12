import type { ComponentType } from "react";
import type { CharBuffer } from "../../../domain/value-objects/char-buffer/CharBuffer";
import type { Position } from "../../../domain/entities/position/Position";

/**
 * Contract every canvas surface implements. The surface owns HOW the buffer is
 * painted (DOM grid today, `<canvas>` later) and how pointer coordinates map
 * back to cells; the editor only ever sees cell-level events. Swapping the
 * renderer is passing a different component to `<Canvas surface={...}>`.
 */
export interface GridSurfaceProps {
  buffer: CharBuffer;
  onCellPointerDown(cell: Position): void;
  onCellPointerMove(cell: Position): void;
  onCellPointerUp(cell: Position): void;
}

export type GridSurfaceComponent = ComponentType<GridSurfaceProps>;
