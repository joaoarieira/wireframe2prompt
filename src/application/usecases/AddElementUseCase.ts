import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Element } from "../../domain/entities/element/Element";

export interface AddElementInput {
  document: WireframeDocument;
  element: Element;
}

/** Adds an element to the document, recording a snapshot for undo. */
export class AddElementUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: AddElementInput): WireframeDocument {
    this.history.push(input.document);
    return input.document.addElement(input.element);
  }
}
