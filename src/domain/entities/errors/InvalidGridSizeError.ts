export class InvalidGridSizeError extends Error {
  constructor() {
    super("GridSize cols and rows must be positive integers");
    this.name = "InvalidGridSizeError";
  }
}
