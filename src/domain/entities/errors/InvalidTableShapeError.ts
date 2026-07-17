export class InvalidTableShapeError extends Error {
  constructor(columns: number, rows: number) {
    super(
      `Invalid table shape: columns=${columns}, rows=${rows}; both must be integers >= 1`,
    );
    this.name = "InvalidTableShapeError";
    Object.setPrototypeOf(this, InvalidTableShapeError.prototype);
  }
}
