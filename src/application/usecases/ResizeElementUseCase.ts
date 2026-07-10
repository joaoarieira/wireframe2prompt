import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Size } from "../../domain/entities/size/Size";

export interface ResizeElementInput {
  document: WireframeDocument;
  elementId: string;
  size: Size;
}

/** Resizes an element, recording a snapshot for undo. */
export class ResizeElementUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: ResizeElementInput): WireframeDocument {
    this.history.push(input.document);
    return input.document.resizeElement(input.elementId, input.size);
  }
}
