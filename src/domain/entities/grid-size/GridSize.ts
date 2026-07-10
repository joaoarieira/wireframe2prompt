import { InvalidGridSizeError } from "../errors/InvalidGridSizeError";
import type { Position } from "../position/Position";

export class GridSize {
  public readonly cols: number;
  public readonly rows: number;

  private constructor(cols: number, rows: number) {
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

  public static create(cols: number, rows: number) {
    return new GridSize(cols, rows);
  }

  public contains(position: Position): boolean {
    return (
      position.col >= 0 &&
      position.row >= 0 &&
      position.col < this.cols &&
      position.row < this.rows
    );
  }

  public equals(other: GridSize): boolean {
    return this.cols === other.cols && this.rows === other.rows;
  }
}
