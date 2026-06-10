import { InvalidPositionError } from "../errors/InvalidPositionError";

export class Position {
  public readonly row: number;
  public readonly col: number;

  private constructor(row: number, col: number) {
    if (!Number.isInteger(row) || !Number.isInteger(col)) {
      throw new InvalidPositionError();
    }
    this.row = row;
    this.col = col;
  }

  public static create(row: number, col: number) {
    return new Position(row, col);
  }
}
