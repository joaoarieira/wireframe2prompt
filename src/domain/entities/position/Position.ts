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

  static create(col: number, row: number): Position {
    return new Position(col, row);
  }

  translate(deltaCol: number, deltaRow: number): Position {
    return Position.create(this.col + deltaCol, this.row + deltaRow);
  }

  equals(other: Position): boolean {
    return this.col === other.col && this.row === other.row;
  }
}
