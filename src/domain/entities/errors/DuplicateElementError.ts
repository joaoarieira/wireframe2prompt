export class DuplicateElementError extends Error {
  constructor(elementId: string) {
    super(`Element already exists: ${elementId}`);
    this.name = "DuplicateElementError";
  }
}
