import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import { ElementNotFoundError } from "../../domain/entities/errors/ElementNotFoundError";

export interface EditElementPropsInput {
  document: WireframeDocument;
  elementId: string;
  props: Readonly<Record<string, unknown>>;
}

/**
 * Edits the type-specific props of an element (text, orientation, …) by
 * delegating to the element's own `withProps`, recording a snapshot for undo.
 */
export class EditElementPropsUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: EditElementPropsInput): WireframeDocument {
    const element = input.document.getElement(input.elementId);
    if (element === undefined) {
      throw new ElementNotFoundError(input.elementId);
    }
    this.history.push(input.document);
    return input.document.replaceElement(element.withProps(input.props));
  }
}
