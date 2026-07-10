export class InvalidSizeError extends Error {
  constructor() {
    super("Size width and height must be positive integers");
    this.name = "InvalidSizeError";
  }
}
