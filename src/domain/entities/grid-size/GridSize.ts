import { InvalidGridSizeError } from "../errors/InvalidGridSizeError";
import type { Position } from "../position/Position";

export class GridSize {
  public readonly rows: number;
  public readonly cols: number;

  private constructor(rows: number, cols: number) {
    if (
      cols <= 0 ||
      rows <= 0 ||
      !Number.isInteger(cols) ||
      !Number.isInteger(rows)
    ) {
      throw new InvalidGridSizeError();
    }
    this.cols = cols;
    this.rows = rows;
  }

  public static create(rows: number, cols: number) {
    return new GridSize(rows, cols);
  }

  public contains(position: Position): boolean {
    return (
      position.col >= 0 &&
      position.row >= 0 &&
      position.col < this.cols &&
      position.row < this.rows
    );
  }
}
