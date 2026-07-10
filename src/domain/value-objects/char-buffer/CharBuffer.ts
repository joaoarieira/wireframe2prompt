import type { CellChar } from "../../entities/cell-char/CellChar";
import type { GridSize } from "../../entities/grid-size/GridSize";
import type { Position } from "../../entities/position/Position";

const EMPTY_CELL = " ";

/**
 * A rows×cols matrix of characters. It is the rasterization target: the
 * compositor writes cells into it and `toString()` returns the raw ASCII
 * output that feeds the LLM. Writes outside `[0, width) × [0, height)` are
 * silently ignored (this is where the "clamp on rasterization" rule lives).
 *
 * Unlike the domain aggregates this buffer is a mutable scratch surface, not
 * persisted state.
 */
export class CharBuffer {
  public readonly width: number;
  public readonly height: number;
  private readonly cells: string[][];

  private constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => EMPTY_CELL),
    );
  }

  static create(gridSize: GridSize): CharBuffer {
    return new CharBuffer(gridSize.cols, gridSize.rows);
  }

  private contains(col: number, row: number): boolean {
    return col >= 0 && col < this.width && row >= 0 && row < this.height;
  }

  set(position: Position, char: CellChar): void {
    if (!this.contains(position.col, position.row)) {
      return;
    }
    this.cells[position.row][position.col] = char.value;
  }

  charAt(position: Position): string {
    if (!this.contains(position.col, position.row)) {
      return EMPTY_CELL;
    }
    return this.cells[position.row][position.col];
  }

  toString(): string {
    return this.cells.map((row) => row.join("")).join("\n");
  }
}
