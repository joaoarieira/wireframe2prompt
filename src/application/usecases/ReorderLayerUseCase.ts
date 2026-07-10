import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";

export interface ReorderLayerInput {
  document: WireframeDocument;
  elementId: string;
  zIndex: number;
}

/** Changes an element's z-index (stacking order), recording a snapshot for undo. */
export class ReorderLayerUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: ReorderLayerInput): WireframeDocument {
    this.history.push(input.document);
    return input.document.reorderElement(input.elementId, input.zIndex);
  }
}
