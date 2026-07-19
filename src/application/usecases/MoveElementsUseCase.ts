import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Position } from "../../domain/entities/position/Position";

export interface ElementMove {
  elementId: string;
  position: Position;
}

export interface MoveElementsInput {
  document: WireframeDocument;
  moves: ReadonlyArray<ElementMove>;
}

/** Moves multiple elements in one history snapshot. Empty list is a no-op. */
export class MoveElementsUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: MoveElementsInput): WireframeDocument {
    if (input.moves.length === 0) {
      return input.document;
    }
    this.history.push(input.document);
    return input.moves.reduce(
      (doc, { elementId, position }) => doc.moveElement(elementId, position),
      input.document,
    );
  }
}
