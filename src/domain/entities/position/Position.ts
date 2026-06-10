import { InvalidPositionError } from "../errors/InvalidPositionError";

export class Position {
  public readonly col: number;
  public readonly row: number;

  private constructor(col: number, row: number) {
    if (!Number.isInteger(col) || !Number.isInteger(row)) {
      throw new InvalidPositionError();
    }
    this.col = col;
    this.row = row;
  }

  public static create(col: number, row: number) {
    return new Position(col, row);
  }
}
