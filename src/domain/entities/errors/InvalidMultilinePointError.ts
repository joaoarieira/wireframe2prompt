export class InvalidMultilinePointError extends Error {
  constructor(detail: string) {
    super(
      `Invalid Multiline point: ${detail}; expected at least 2 orthogonally connected points with non-negative integer offsets`,
    );
    this.name = "InvalidMultilinePointError";
    Object.setPrototypeOf(this, InvalidMultilinePointError.prototype);
  }
}
