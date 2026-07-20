import type { ComponentType } from "react";
import type { CharBuffer } from "../../../domain/value-objects/char-buffer/CharBuffer";
import type { Position } from "../../../domain/entities/position/Position";
import type { SurfacePoint } from "../../state/tools/CanvasTool";

/**
 * Contract every canvas surface implements. The surface owns HOW the buffer is
 * painted (DOM grid today, `<canvas>` later) and how pointer coordinates map
 * back to cells; the editor only ever sees cell-level events. Swapping the
 * renderer is passing a different component to `<Canvas surface={...}>`.
 */
export interface GridSurfaceProps {
  buffer: CharBuffer;
  onCellPointerDown(cell: Position, point: SurfacePoint): void;
  onCellPointerMove(cell: Position, point: SurfacePoint): void;
  onCellPointerUp(cell: Position, point: SurfacePoint): void;
  onCellDoubleClick(cell: Position): void;
  /**
   * Whether to draw the per-cell hover outline. Off for placement tools, which
   * show a full element ghost under the cursor instead. Defaults to on.
   */
  showHoverHighlight?: boolean;
}

export type GridSurfaceComponent = ComponentType<GridSurfaceProps>;
