import type { IRenderer } from "../../domain/ports/IRenderer";
import type { GridSize } from "../../domain/entities/grid-size/GridSize";
import { Position } from "../../domain/entities/position/Position";
import { CellChar } from "../../domain/entities/cell-char/CellChar";
import { CharBuffer } from "../../domain/value-objects/char-buffer/CharBuffer";

/**
 * Deterministic {@link IRenderer} that accumulates into a {@link CharBuffer} and
 * yields the raw ASCII string. This is the renderer used for the LLM output and
 * for golden tests.
 */
export class StringRenderer implements IRenderer {
  private readonly gridSize: GridSize;
  private buffer: CharBuffer;

  constructor(gridSize: GridSize) {
    this.gridSize = gridSize;
    this.buffer = CharBuffer.create(gridSize);
  }

  clear(): void {
    this.buffer = CharBuffer.create(this.gridSize);
  }

  drawChar(position: Position, char: CellChar): void {
    this.buffer.set(position, char);
  }

  drawText(position: Position, text: string): void {
    const chars = [...text];
    for (let i = 0; i < chars.length; i++) {
      this.buffer.set(
        Position.create(position.col + i, position.row),
        CellChar.create(chars[i]),
      );
    }
  }

  present(): void {
    /* no-op: the string is produced lazily by toString() */
  }

  getBuffer(): CharBuffer {
    return this.buffer;
  }

  toString(): string {
    return this.buffer.toString();
  }
}
