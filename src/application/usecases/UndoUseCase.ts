import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface UndoInput {
  document: WireframeDocument;
}

/**
 * Restores the previous document snapshot. Returns the current document
 * unchanged when there is nothing to undo.
 */
export class UndoUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: UndoInput): WireframeDocument {
    return this.history.undo(input.document) ?? input.document;
  }
}
