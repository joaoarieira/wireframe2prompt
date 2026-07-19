import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface RemoveElementsInput {
  document: WireframeDocument;
  elementIds: readonly string[];
}

/** Removes multiple elements in one history snapshot. Empty list is a no-op. */
export class RemoveElementsUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: RemoveElementsInput): WireframeDocument {
    if (input.elementIds.length === 0) {
      return input.document;
    }
    this.history.push(input.document);
    return input.elementIds.reduce(
      (doc, elementId) => doc.removeElement(elementId),
      input.document,
    );
  }
}
