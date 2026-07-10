export class ElementNotFoundError extends Error {
  constructor(elementId: string) {
    super(`Element not found: ${elementId}`);
    this.name = "ElementNotFoundError";
  }
}
