export class InvalidPositionError extends Error {
  constructor() {
    super("Position col and row must be integers");
    this.name = "InvalidPositionError";
    Object.setPrototypeOf(this, InvalidPositionError.prototype);
  }
}
