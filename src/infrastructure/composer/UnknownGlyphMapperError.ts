export class UnknownGlyphMapperError extends Error {
  constructor(kind: string) {
    super(`No glyph mapper registered for kind: ${kind}`);
    this.name = "UnknownGlyphMapperError";
  }
}
