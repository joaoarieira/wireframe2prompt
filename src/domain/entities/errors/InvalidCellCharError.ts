export class InvalidCellCharError extends Error {
  constructor() {
    super("CellChar value length must be exactly 1");
    this.name = "InvalidCellCharError";
    Object.setPrototypeOf(this, InvalidCellCharError.prototype);
  }
}
