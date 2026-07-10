import type { IHistory } from "../../domain/ports/IHistory";
import type { WireframeDocument } from "../../domain/aggregates/wireframe-document/WireframeDocument";
import type { Position } from "../../domain/entities/position/Position";

export interface MoveElementInput {
  document: WireframeDocument;
  elementId: string;
  position: Position;
}

/** Moves an element to a new position, recording a snapshot for undo. */
export class MoveElementUseCase {
  private readonly history: IHistory;

  constructor(history: IHistory) {
    this.history = history;
  }

  execute(input: MoveElementInput): WireframeDocument {
    this.history.push(input.document);
    return input.document.moveElement(input.elementId, input.position);
  }
}
