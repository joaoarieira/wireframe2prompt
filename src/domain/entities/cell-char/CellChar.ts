export class CellChar {
  public readonly value: string | undefined;

  private constructor(value: string) {
    if (value.trim().length !== 1) {
      throw new Error("CellChar value length must be exactly 1");
    }
    this.value = value;
  }

  static create(value: string) {
    return new CellChar(value);
  }
}
