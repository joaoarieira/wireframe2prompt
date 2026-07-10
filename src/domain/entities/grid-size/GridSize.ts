import { InvalidGridSizeError } from "../errors/InvalidGridSizeError";

export class GridSize {
  public readonly cols: number;
  public readonly rows: number;

  private constructor(cols: number, rows: number) {
    if (
      !Number.isInteger(cols) ||
      !Number.isInteger(rows) ||
      cols <= 0 ||
      rows <= 0
    ) {
      throw new InvalidGridSizeError();
    }
    this.cols = cols;
    this.rows = rows;
  }

  static create(cols: number, rows: number): GridSize {
    return new GridSize(cols, rows);
  }

  equals(other: GridSize): boolean {
    return this.cols === other.cols && this.rows === other.rows;
  }
}
