import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface LayerReorder {
  elementId: string;
  zIndex: number;
}

export interface ReorderLayersInput {
  document: WireframeDocument;
  reorders: ReadonlyArray<LayerReorder>;
}

/** Changes the z-index of multiple elements in one history snapshot. Empty list is a no-op. */
export class ReorderLayersUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: ReorderLayersInput): WireframeDocument {
    if (input.reorders.length === 0) {
      return input.document;
    }
    this.history.push(input.document);
    return input.reorders.reduce(
      (doc, { elementId, zIndex }) => doc.reorderElement(elementId, zIndex),
      input.document,
    );
  }
}
