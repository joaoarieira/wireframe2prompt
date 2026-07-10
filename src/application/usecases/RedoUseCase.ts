import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface RedoInput {
  document: WireframeDocument;
}

/**
 * Re-applies the next document snapshot. Returns the current document unchanged
 * when there is nothing to redo.
 */
export class RedoUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: RedoInput): WireframeDocument {
    return this.history.redo(input.document) ?? input.document;
  }
}
