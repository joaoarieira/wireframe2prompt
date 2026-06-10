export class InvalidGridSizeError extends Error {
  constructor() {
    super("GridSize width and height must be integers and greater than zero");
    this.name = "InvalidGridSizeError";
    Object.setPrototypeOf(this, InvalidGridSizeError.prototype);
  }
}
