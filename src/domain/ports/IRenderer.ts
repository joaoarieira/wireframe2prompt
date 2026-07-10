import type { CellChar } from "../entities/cell-char/CellChar";
import type { Position } from "../entities/position/Position";

/**
 * Output port for visual rendering. Implementations decide the target surface
 * (a string buffer, the DOM, a `<canvas>`) without the domain knowing about it.
 */
export interface IRenderer {
  clear(): void;
  drawChar(position: Position, char: CellChar): void;
  drawText(position: Position, text: string): void;
  /** Flush whatever was drawn to the underlying surface. */
  present(): void;
}
