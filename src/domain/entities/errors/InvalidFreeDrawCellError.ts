export class InvalidFreeDrawCellError extends Error {
  constructor(key: string) {
    super(
      `Invalid FreeDraw cell key "${key}"; expected "col,row" with non-negative integers`,
    );
    this.name = "InvalidFreeDrawCellError";
    Object.setPrototypeOf(this, InvalidFreeDrawCellError.prototype);
  }
}
