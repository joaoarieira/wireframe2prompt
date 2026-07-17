export class InvalidFreeDrawTargetError extends Error {
  constructor(elementId: string, kind: string) {
    super(
      `Element "${elementId}" is of kind "${kind}", expected "freedraw"`,
    );
    this.name = "InvalidFreeDrawTargetError";
    Object.setPrototypeOf(this, InvalidFreeDrawTargetError.prototype);
  }
}
