import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface RemoveElementInput {
  document: WireframeDocument;
  elementId: string;
}

/** Removes an element from the document, recording a snapshot for undo. */
export class RemoveElementUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: RemoveElementInput): WireframeDocument {
    this.history.push(input.document);
    return input.document.removeElement(input.elementId);
  }
}
