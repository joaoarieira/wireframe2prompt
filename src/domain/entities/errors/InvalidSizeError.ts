export class InvalidSizeError extends Error {
  constructor() {
    super("Size width and height must be integers and greater than zero");
    this.name = "InvalidSizeError";
    Object.setPrototypeOf(this, InvalidSizeError.prototype);
  }
}
