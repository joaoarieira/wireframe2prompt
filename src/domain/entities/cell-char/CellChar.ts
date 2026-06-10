import { InvalidCellCharError } from "../errors/InvalidCellCharError";

export class CellChar {
  public readonly value: string;

  private constructor(value: string) {
    if ([...value].length !== 1) {
      throw new InvalidCellCharError();
    }
    this.value = value;
  }

  static create(value: string) {
    return new CellChar(value);
  }

  equals(other: CellChar): boolean {
    return this.value === other.value;
  }
}
