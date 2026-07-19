import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Element } from "../../domain/entities/element/Element";

export interface AddElementsInput {
  document: WireframeDocument;
  elements: readonly Element[];
}

/** Adds multiple elements in one history snapshot. Empty list is a no-op. */
export class AddElementsUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: AddElementsInput): WireframeDocument {
    if (input.elements.length === 0) {
      return input.document;
    }
    this.history.push(input.document);
    return input.elements.reduce(
      (doc, el) => doc.addElement(el),
      input.document,
    );
  }
}
