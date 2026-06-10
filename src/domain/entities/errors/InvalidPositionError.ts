export class InvalidPositionError extends Error {
  constructor() {
    super("Position value must be integer");
    this.name = "InvalidPositionError";
  }
}
