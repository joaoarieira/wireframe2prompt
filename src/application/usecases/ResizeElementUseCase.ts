import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Size } from "../../domain/entities/size/Size";

export interface ResizeElementInput {
  document: WireframeDocument;
  elementId: string;
  size: Size;
  /** Kind-props applied in the same snapshot (e.g. a line's orientation flip). */
  props?: Readonly<Record<string, unknown>>;
}

/** Resizes an element, recording a snapshot for undo. */
export class ResizeElementUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: ResizeElementInput): WireframeDocument {
    this.history.push(input.document);
    const resized = input.document.resizeElement(input.elementId, input.size);
    if (input.props === undefined) {
      return resized;
    }
    // The element is guaranteed present — resizeElement throws otherwise.
    const element = resized.getElement(input.elementId)!;
    return resized.replaceElement(element.withProps(input.props));
  }
}
